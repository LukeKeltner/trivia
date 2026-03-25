from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Question, GameRound
from auth import make_question_token
import random
import uuid

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("/random")
def get_random_question(subtopic_id: int, user_id: str, db: Session = Depends(get_db)):
    answered_correctly = db.query(GameRound.question_id).filter(
        GameRound.user_id == uuid.UUID(user_id),
        GameRound.is_correct == True,
    ).subquery()

    available = db.query(Question).filter(
        Question.subtopic_id == subtopic_id,
        Question.id.notin_(answered_correctly),
    ).all()

    if not available:
        raise HTTPException(status_code=404, detail="NO_QUESTIONS_LEFT")

    easy = [q for q in available if q.difficulty == 'easy']
    hard = [q for q in available if q.difficulty == 'hard']

    if easy and hard:
        pool = hard if random.random() < 0.3 else easy
    elif hard:
        pool = hard
    else:
        pool = easy

    question = random.choice(pool)
    return {
        "id": question.id,
        "question_text": question.question_text,
        "difficulty": question.difficulty,
        "question_token": make_question_token(question.id),
        "answers": [
            {"id": a.id, "answer_text": a.answer_text}
            for a in question.answers
        ],
    }
