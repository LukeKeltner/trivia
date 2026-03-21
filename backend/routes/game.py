from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Answer, GameRound, Profile, Question, Topic
import uuid

router = APIRouter(prefix="/game", tags=["game"])


class CreateProfileRequest(BaseModel):
    user_id: str
    username: str


class SubmitAnswerRequest(BaseModel):
    user_id: str
    question_id: int
    chosen_answer_id: int
    bet: int


@router.post("/profile")
def create_profile(payload: CreateProfileRequest, db: Session = Depends(get_db)):
    user_uuid = uuid.UUID(payload.user_id)
    existing = db.query(Profile).filter(Profile.id == user_uuid).first()
    if existing:
        return {"coins": existing.coins}
    profile = Profile(id=user_uuid, username=payload.username, coins=100)
    db.add(profile)
    db.commit()
    return {"coins": 100}


@router.post("/submit")
def submit_answer(payload: SubmitAnswerRequest, db: Session = Depends(get_db)):
    answer = db.query(Answer).filter(Answer.id == payload.chosen_answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    profile = db.query(Profile).filter(Profile.id == uuid.UUID(payload.user_id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    if payload.bet > profile.coins:
        raise HTTPException(status_code=400, detail="Bet exceeds coin balance")

    is_correct = answer.is_correct
    profile.coins += payload.bet if is_correct else -payload.bet

    round = GameRound(
        user_id=profile.id,
        question_id=payload.question_id,
        chosen_answer_id=payload.chosen_answer_id,
        bet=payload.bet,
        is_correct=is_correct,
    )
    db.add(round)
    db.commit()

    return {
        "is_correct": is_correct,
        "coins": profile.coins,
    }


@router.get("/profile/{user_id}")
def get_profile(user_id: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == uuid.UUID(user_id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.coins <= 0:
        profile.coins = 10
        db.commit()
    return {"coins": profile.coins, "topped_up": profile.coins == 10}


@router.get("/progress/{user_id}")
def get_progress(user_id: str, db: Session = Depends(get_db)):
    user_uuid = uuid.UUID(user_id)
    topics = db.query(Topic).all()
    result = []
    for topic in topics:
        total = db.query(Question).filter(Question.topic_id == topic.id).count()
        completed = db.query(GameRound.question_id).filter(
            GameRound.user_id == user_uuid,
            GameRound.is_correct == True,
            GameRound.question_id.in_(
                db.query(Question.id).filter(Question.topic_id == topic.id)
            ),
        ).distinct().count()
        result.append({"topic_id": topic.id, "total": total, "completed": completed})
    return result


@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    profiles = db.query(Profile).order_by(Profile.coins.desc()).all()
    return [
        {"username": p.username or "Anonymous", "coins": p.coins, "id": str(p.id)}
        for p in profiles
    ]
