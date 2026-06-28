from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String, unique=True, index=True)
    title = Column(String, default="Instant Meeting")
    description = Column(String, nullable=True)
    host_name = Column(String, default="Nikhil")
    password = Column(String, nullable=True)
    is_instant = Column(Boolean, default=False)
    scheduled_time = Column(DateTime, nullable=True)
    duration = Column(Integer, default=None, nullable=True)
    invite_link = Column(String, unique=True)
    created_at = Column(DateTime, default=func.now())
    is_active = Column(Boolean, default=True)

class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(String)
    display_name = Column(String)
    joined_at = Column(DateTime, default=func.now())
    is_host = Column(Boolean, default=False)