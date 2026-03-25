from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import CompetitionRoom, Profile, Question, Answer, Subtopic
from auth import get_current_user
import uuid
import random
import string
import time
import os

router = APIRouter(prefix="/competitions", tags=["competitions"])

PENALTY_SECONDS = 10

# Module-level state shared across all WebSocket connections on this server instance
# room_code -> {"creator_id", "joiner_id", "questions", "player_state", "finished"}
game_state: dict = {}

# room_code -> {user_id: websocket}
connections: dict = {}


def generate_room_code(db: Session) -> str:
    for _ in range(20):
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        exists = db.query(CompetitionRoom).filter(
            CompetitionRoom.room_code == code,
            CompetitionRoom.status.in_(['waiting', 'in_progress']),
        ).first()
        if not exists:
            return code
    raise HTTPException(status_code=500, detail="Could not generate unique room code")


class CreateRoomRequest(BaseModel):
    user_id: str
    subtopic_id: int
    bet: int


class JoinRoomRequest(BaseModel):
    user_id: str
    room_code: str


@router.get("/room/{code}")
def get_room(code: str, db: Session = Depends(get_db)):
    room = db.query(CompetitionRoom).filter(
        CompetitionRoom.room_code == code.upper(),
        CompetitionRoom.status == 'waiting',
    ).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found or already started")

    creator = db.query(Profile).filter(Profile.id == room.creator_id).first()
    subtopic = db.query(Subtopic).filter(Subtopic.id == room.subtopic_id).first()

    return {
        "room_code": room.room_code,
        "subtopic_name": subtopic.name if subtopic else "Unknown",
        "bet": room.bet,
        "creator_username": creator.username if creator else "Unknown",
    }


@router.post("/create")
def create_room(payload: CreateRoomRequest, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    if current_user != payload.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if payload.bet < 1:
        raise HTTPException(status_code=400, detail="Bet must be at least 1 coin")

    profile = db.query(Profile).filter(Profile.id == uuid.UUID(payload.user_id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.coins < payload.bet:
        raise HTTPException(status_code=400, detail="Not enough coins")

    subtopic = db.query(Subtopic).filter(Subtopic.id == payload.subtopic_id).first()
    if not subtopic:
        raise HTTPException(status_code=404, detail="Subtopic not found")

    question_ids = [q.id for q in db.query(Question.id).filter(Question.subtopic_id == payload.subtopic_id).all()]
    if not question_ids:
        raise HTTPException(status_code=400, detail="No questions available for this subtopic")

    random.shuffle(question_ids)
    code = generate_room_code(db)

    profile.coins -= payload.bet
    room = CompetitionRoom(
        room_code=code,
        subtopic_id=payload.subtopic_id,
        creator_id=uuid.UUID(payload.user_id),
        bet=payload.bet,
        status='waiting',
        question_order=question_ids,
    )
    db.add(room)
    db.commit()

    return {
        "room_code": code,
        "subtopic_name": subtopic.name,
        "bet": payload.bet,
        "coins": profile.coins,
    }


@router.post("/join")
def join_room(payload: JoinRoomRequest, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    if current_user != payload.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    room = db.query(CompetitionRoom).filter(
        CompetitionRoom.room_code == payload.room_code.upper(),
        CompetitionRoom.status == 'waiting',
    ).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found or already started")
    if str(room.creator_id) == payload.user_id:
        raise HTTPException(status_code=400, detail="You cannot join your own room")

    profile = db.query(Profile).filter(Profile.id == uuid.UUID(payload.user_id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.coins < room.bet:
        raise HTTPException(status_code=400, detail="Not enough coins")

    subtopic = db.query(Subtopic).filter(Subtopic.id == room.subtopic_id).first()
    creator = db.query(Profile).filter(Profile.id == room.creator_id).first()

    profile.coins -= room.bet
    room.joiner_id = uuid.UUID(payload.user_id)
    room.status = 'in_progress'
    db.commit()

    return {
        "room_code": room.room_code,
        "subtopic_name": subtopic.name if subtopic else "Unknown",
        "bet": room.bet,
        "creator_username": creator.username if creator else "Unknown",
        "coins": profile.coins,
    }


def validate_ws_token(token: str, user_id: str) -> bool:
    import base64 as _b64
    raw = os.environ.get("SUPABASE_JWT_SECRET", "")
    if not raw or not token:
        return True  # Skip validation in dev if secret not set
    try:
        secret = _b64.b64decode(raw)
    except Exception:
        secret = raw
    try:
        from jose import jwt as jose_jwt
        payload = jose_jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
        return payload.get("sub") == user_id
    except Exception:
        return False


@router.websocket("/ws/{room_code}/{user_id}")
async def competition_websocket(
    websocket: WebSocket,
    room_code: str,
    user_id: str,
    db: Session = Depends(get_db),
    token: str = Query(None),
):
    if not validate_ws_token(token, user_id):
        await websocket.close(code=4001)
        return

    room = db.query(CompetitionRoom).filter(
        CompetitionRoom.room_code == room_code,
        CompetitionRoom.status.in_(['waiting', 'in_progress']),
    ).first()
    if not room:
        await websocket.close(code=4004)
        return

    creator_id = str(room.creator_id)
    joiner_id = str(room.joiner_id) if room.joiner_id else None

    if user_id not in (creator_id, joiner_id):
        await websocket.close(code=4003)
        return

    await websocket.accept()

    # Register connection
    if room_code not in connections:
        connections[room_code] = {}
    connections[room_code][user_id] = websocket

    # Initialize game state on first connection
    if room_code not in game_state:
        game_state[room_code] = {
            "creator_id": creator_id,
            "joiner_id": joiner_id,
            "questions": None,
            "player_state": {
                creator_id: {"current_q": 0, "penalty_until": None},
            },
            "finished": False,
        }

    state = game_state[room_code]

    # Update joiner info if they just connected
    if joiner_id and joiner_id not in state["player_state"]:
        state["joiner_id"] = joiner_id
        state["player_state"][joiner_id] = {"current_q": 0, "penalty_until": None}

    try:
        both_connected = (
            joiner_id is not None
            and creator_id in connections.get(room_code, {})
            and joiner_id in connections.get(room_code, {})
        )

        if both_connected and state["questions"] is None:
            # Load questions once and store in state
            questions_data = []
            for qid in room.question_order:
                q = db.query(Question).filter(Question.id == qid).first()
                if q:
                    answers = [{"id": a.id, "answer_text": a.answer_text} for a in q.answers]
                    random.shuffle(answers)
                    questions_data.append({
                        "id": q.id,
                        "question_text": q.question_text,
                        "difficulty": q.difficulty,
                        "answers": answers,
                    })
            state["questions"] = questions_data

            creator_profile = db.query(Profile).filter(Profile.id == room.creator_id).first()
            joiner_profile = db.query(Profile).filter(Profile.id == room.joiner_id).first()

            # Send game_start to both players
            for pid, opponent_name in [
                (creator_id, joiner_profile.username if joiner_profile else "Opponent"),
                (joiner_id, creator_profile.username if creator_profile else "Opponent"),
            ]:
                if pid in connections.get(room_code, {}):
                    await connections[room_code][pid].send_json({
                        "type": "game_start",
                        "questions": questions_data,
                        "opponent_username": opponent_name,
                        "total_questions": len(questions_data),
                        "bet": room.bet,
                    })
        elif not both_connected:
            await websocket.send_json({"type": "waiting"})

        # Main message loop
        while True:
            data = await websocket.receive_json()

            if data.get("type") != "answer":
                continue

            state = game_state.get(room_code)
            if not state or state["finished"]:
                continue

            player = state["player_state"].get(user_id)
            if player is None:
                continue

            # Enforce penalty
            if player["penalty_until"] and time.time() < player["penalty_until"]:
                await websocket.send_json({
                    "type": "penalty_active",
                    "remaining": round(player["penalty_until"] - time.time(), 1),
                })
                continue

            current_q_index = player["current_q"]
            questions = state["questions"]
            if questions is None or current_q_index >= len(questions):
                continue

            current_question = questions[current_q_index]
            answer_id = data.get("answer_id")

            answer = db.query(Answer).filter(
                Answer.id == answer_id,
                Answer.question_id == current_question["id"],
            ).first()
            if not answer:
                continue

            if answer.is_correct:
                player["current_q"] += 1
                player["penalty_until"] = None

                await websocket.send_json({
                    "type": "answer_result",
                    "correct": True,
                    "questions_done": player["current_q"],
                    "total": len(questions),
                })

                # Notify opponent of progress update
                opponent_id = joiner_id if user_id == creator_id else creator_id
                if opponent_id and opponent_id in connections.get(room_code, {}):
                    await connections[room_code][opponent_id].send_json({
                        "type": "opponent_progress",
                        "questions_done": player["current_q"],
                        "total": len(questions),
                    })

                # Check for winner
                if player["current_q"] >= len(questions) and not state["finished"]:
                    state["finished"] = True

                    db.expire_all()
                    winner_profile = db.query(Profile).filter(Profile.id == uuid.UUID(user_id)).first()
                    loser_id = joiner_id if user_id == creator_id else creator_id
                    loser_profile = db.query(Profile).filter(Profile.id == uuid.UUID(loser_id)).first() if loser_id else None

                    if winner_profile:
                        winner_profile.coins += room.bet * 2
                    room.status = 'finished'
                    room.winner_id = uuid.UUID(user_id)
                    db.commit()

                    for pid, ws in list(connections.get(room_code, {}).items()):
                        you_win = pid == user_id
                        coins_now = winner_profile.coins if you_win else (loser_profile.coins if loser_profile else None)
                        try:
                            await ws.send_json({
                                "type": "game_over",
                                "you_win": you_win,
                                "coins": coins_now,
                            })
                        except Exception:
                            pass
            else:
                player["penalty_until"] = time.time() + PENALTY_SECONDS
                await websocket.send_json({
                    "type": "answer_result",
                    "correct": False,
                    "penalty_seconds": PENALTY_SECONDS,
                })

    except WebSocketDisconnect:
        pass

    finally:
        if room_code in connections:
            connections[room_code].pop(user_id, None)

        # If game was live and not finished, opponent auto-wins
        state = game_state.get(room_code)
        if state and not state["finished"]:
            opponent_id = state["joiner_id"] if user_id == state["creator_id"] else state["creator_id"]
            if opponent_id and opponent_id in connections.get(room_code, {}):
                state["finished"] = True
                try:
                    db.expire_all()
                    opp_profile = db.query(Profile).filter(Profile.id == uuid.UUID(opponent_id)).first()
                    if opp_profile:
                        opp_profile.coins += room.bet * 2
                    room.status = 'finished'
                    room.winner_id = uuid.UUID(opponent_id)
                    db.commit()
                    await connections[room_code][opponent_id].send_json({
                        "type": "opponent_disconnected",
                        "you_win": True,
                        "coins": opp_profile.coins if opp_profile else None,
                    })
                except Exception:
                    pass
