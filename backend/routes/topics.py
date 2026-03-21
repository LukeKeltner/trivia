from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Topic

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/")
def get_topics(db: Session = Depends(get_db)):
    topics = db.query(Topic).all()
    return [{"id": t.id, "name": t.name} for t in topics]
