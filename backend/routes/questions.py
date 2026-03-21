from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Question, GameRound
import random
import uuid

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("/random")
def get_random_question(topic_id: int, user_id: str, db: Session = Depends(get_db)):
    answered_correctly = db.query(GameRound.question_id).filter(
        GameRound.user_id == uuid.UUID(user_id),
        GameRound.is_correct == True,
    ).subquery()

    questions = db.query(Question).filter(
        Question.topic_id == topic_id,
        Question.id.notin_(answered_correctly),
    ).all()

    if not questions:
        raise HTTPException(status_code=404, detail="NO_QUESTIONS_LEFT")

    question = random.choice(questions)
    return {
        "id": question.id,
        "question_text": question.question_text,
        "answers": [
            {"id": a.id, "answer_text": a.answer_text}
            for a in question.answers
        ],
    }
