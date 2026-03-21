from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Question
import random

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("/random")
def get_random_question(topic_id: int, db: Session = Depends(get_db)):
    questions = db.query(Question).filter(Question.topic_id == topic_id).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this topic")

    question = random.choice(questions)
    return {
        "id": question.id,
        "question_text": question.question_text,
        "answers": [
            {"id": a.id, "answer_text": a.answer_text}
            for a in question.answers
        ],
    }
