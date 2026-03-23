from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Subtopic, Topic

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/")
def get_topics(db: Session = Depends(get_db)):
    topics = db.query(Topic).all()
    return [{"id": t.id, "name": t.name} for t in topics]


@router.get("/all-subtopics")
def get_all_subtopics(db: Session = Depends(get_db)):
    subtopics = db.query(Subtopic).all()
    return [{"id": s.id, "name": s.name, "topic_id": s.topic_id} for s in subtopics]


@router.get("/{topic_id}/subtopics")
def get_subtopics(topic_id: int, db: Session = Depends(get_db)):
    subtopics = db.query(Subtopic).filter(Subtopic.topic_id == topic_id).all()
    return [{"id": s.id, "name": s.name, "topic_id": s.topic_id} for s in subtopics]
