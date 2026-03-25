from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    subtopics = relationship("Subtopic", back_populates="topic")


class Subtopic(Base):
    __tablename__ = "subtopics"

    id = Column(Integer, primary_key=True)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    name = Column(String, nullable=False)
    topic = relationship("Topic", back_populates="subtopics")
    questions = relationship("Question", back_populates="subtopic")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"))
    question_text = Column(String, nullable=False)
    difficulty = Column(String, nullable=False, server_default='easy')
    subtopic = relationship("Subtopic", back_populates="questions")
    answers = relationship("Answer", back_populates="question")


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    answer_text = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)
    question = relationship("Question", back_populates="answers")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True)
    username = Column(String, unique=True, nullable=True)
    coins = Column(Integer, nullable=False, default=100)
    avatar = Column(String, nullable=False, server_default='🧠')
    title = Column(String, nullable=True)
    theme = Column(String, nullable=False, server_default='purple')
    game_rounds = relationship("GameRound", back_populates="user")


class GameRound(Base):
    __tablename__ = "game_rounds"

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    chosen_answer_id = Column(Integer, ForeignKey("answers.id"))
    bet = Column(Integer, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("Profile", back_populates="game_rounds")


class CompetitionRoom(Base):
    __tablename__ = "competition_rooms"

    id = Column(Integer, primary_key=True)
    room_code = Column(String(6), unique=True, nullable=False)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"))
    creator_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    joiner_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    bet = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default='waiting')
    winner_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    question_order = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
