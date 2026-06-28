from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
import models, schemas
import uuid
import socketio
from datetime import datetime

models.Base.metadata.create_all(bind=engine)

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*'
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

socket_app = socketio.ASGIApp(sio, app)

# rooms[room_id] = list of {sid, user_name}
rooms = {}

@sio.event
async def connect(sid, environ):
    print(f"Connected: {sid}")

@sio.event
async def disconnect(sid, *args):
    print(f"Client disconnected: {sid}")
    for room_id in list(rooms.keys()):
        room = rooms[room_id]
        user = next((u for u in room if u["sid"] == sid), None)
        if user:
            room.remove(user)
            try:
                await sio.emit("user_left", {"sid": sid}, room=room_id)
            except:
                pass
            if not room:
                del rooms[room_id]
            break

@sio.event
async def join_room(sid, data):
    room_id = data["room_id"]
    user_name = data["user_name"]

    if room_id not in rooms:
        rooms[room_id] = []

    # Get existing users before adding the new one
    existing = [u["sid"] for u in rooms[room_id]]

    # Notify existing users that someone new joined (they will initiate offers)
    await sio.emit("user_joined", {"sid": sid, "user_name": user_name}, room=room_id)

    # Tell every existing user to introduce themselves to the newcomer
    # so the newcomer knows their names
    for existing_sid in existing:
        await sio.emit("introduce_yourself", {"to": sid}, to=existing_sid)

    # Add newcomer to room
    await sio.enter_room(sid, room_id)
    rooms[room_id].append({"sid": sid, "user_name": user_name})

    # Send existing user sids to the newcomer
    await sio.emit("existing_users", {"users": existing}, to=sid)

@sio.event
async def my_identity(sid, data):
    # An existing user is telling the newcomer their name
    to = data["to"]
    user_name = data["user_name"]
    await sio.emit("peer_identity", {"from": sid, "user_name": user_name}, to=to)

@sio.event
async def offer(sid, data):
    await sio.emit("offer", {"offer": data["offer"], "from": sid}, to=data["to"])

@sio.event
async def answer(sid, data):
    await sio.emit("answer", {"answer": data["answer"], "from": sid}, to=data["to"])

@sio.event
async def ice_candidate(sid, data):
    await sio.emit("ice_candidate", {"candidate": data["candidate"], "from": sid}, to=data["to"])

@sio.event
async def send_message(sid, data):
    await sio.emit("receive_message", {
        "sender": data["sender"],
        "message": data["message"],
        "time": data["time"]
    }, room=data["room_id"], skip_sid=sid)

@sio.event
async def send_reaction(sid, data):
    await sio.emit("receive_reaction", {
        "emoji": data["emoji"],
        "sender": data["sender"]
    }, room=data["room_id"])

# REST APIs
@app.get("/")
def read_root():
    return {"message": "Zoom Clone Backend Running"}

@app.post("/meetings/", response_model=schemas.MeetingResponse)
def create_meeting(meeting: schemas.MeetingCreate, db: Session = Depends(get_db)):
    meeting_id = str(uuid.uuid4())[:9].replace("-", "").upper()
    invite_link = f"http://localhost:3000/meeting/{meeting_id}"
    db_meeting = models.Meeting(
        meeting_id=meeting_id,
        title=meeting.title,
        description=meeting.description,
        scheduled_time=meeting.scheduled_time,
        duration=meeting.duration if meeting.duration else 60,
        is_instant=meeting.is_instant,
        password=meeting.password,
        invite_link=invite_link,
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

@app.get("/meetings/")
def get_meetings(db: Session = Depends(get_db)):
    return db.query(models.Meeting).all()

@app.get("/meetings/upcoming")
def get_upcoming_meetings(db: Session = Depends(get_db)):
    return db.query(models.Meeting).filter(
        models.Meeting.is_instant == False,
        models.Meeting.is_active == True
    ).order_by(models.Meeting.scheduled_time).all()

@app.get("/meetings/{meeting_id}")
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(
        models.Meeting.meeting_id == meeting_id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@app.post("/meetings/{meeting_id}/join")
def join_meeting(meeting_id: str, participant: schemas.ParticipantCreate, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(
        models.Meeting.meeting_id == meeting_id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db_participant = models.Participant(
        meeting_id=meeting_id,
        display_name=participant.display_name,
        is_host=participant.is_host,
    )
    db.add(db_participant)
    db.commit()
    return {"message": "Joined successfully", "meeting": meeting}

@app.post("/meetings/{meeting_id}/end")
async def end_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(
        models.Meeting.meeting_id == meeting_id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    meeting.is_active = False
    db.commit()
    await sio.emit("meeting_ended", {
        "message": "Host has ended the meeting"
    }, room=meeting_id)
    return {"message": "Meeting ended"}

@app.get("/meetings/{meeting_id}/participants")
def get_participants(meeting_id: str, db: Session = Depends(get_db)):
    return db.query(models.Participant).filter(
        models.Participant.meeting_id == meeting_id
    ).all()