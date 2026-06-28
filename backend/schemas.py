from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MeetingCreate(BaseModel):
    title: Optional[str] = "Instant Meeting"
    description: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    duration: Optional[int] = None
    is_instant: Optional[bool] = False
    password: Optional[str] = None

class MeetingResponse(BaseModel):
    id: int
    meeting_id: str
    title: str
    host_name: str
    invite_link: str
    scheduled_time: Optional[datetime]
    duration: Optional[int] = None
    is_instant: bool
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class ParticipantCreate(BaseModel):
    display_name: str
    is_host: Optional[bool] = False