# 🎥 ZoomClone — Video Conferencing Platform

A full-stack video conferencing web application inspired by Zoom, built as part of an SDE Fullstack Assignment. The platform replicates Zoom's core meeting workflows, UI design, and real-time communication features using modern web technologies.

---

## 🌐 Live Demo

- **🚀 Live Application:** https://zooom-clone.netlify.app
- **⚙️ Backend API:** https://zoom-clone-backend-otem.onrender.com
- **📖 API Documentation:** https://zoom-clone-backend-otem.onrender.com/docs
- **💻 GitHub Repository:** https://github.com/m-akanksha49/zoom-clone

---

## ✨ Features Implemented

### 🏠 Dashboard
- Clean Zoom-inspired landing page
- New Meeting, Join, Schedule, Share Screen action buttons
- Upcoming Meetings section (scheduled meetings only)
- Recent Meetings section (ended meetings)
- Copy invite link directly from dashboard

### ⚡ Instant Meeting
- One-click instant meeting creation
- Auto-generated unique 9-character Meeting ID
- Shareable invite link generated automatically
- Redirect to meeting room instantly

### 🔗 Join Meeting
- Join via Meeting ID or paste full invite link
- Auto-extracts Meeting ID from invite link
- Display name entry before joining
- Meeting existence validation with error messages

### 📅 Schedule Meeting
- Title and description fields
- Date and time picker
- Duration selection
- Auto-generated meeting link
- Stored in database and shown in Upcoming Meetings

### 🎥 Meeting Room
- Real camera and microphone via WebRTC
- Multi-participant video grid (auto-adjusts layout)
- Mute / Unmute audio (real audio track toggle)
- Start / Stop video (real video track toggle)
- Share Screen button
- Live in-meeting chat via Socket.io
- Emoji reactions (floating animations for all participants)
- Unread message badge on chat button
- Participants panel with You / Host labels
- Copy invite link from inside meeting
- Leave Meeting (only you leave)
- End Meeting for All (host ends, everyone is redirected)
- Meeting automatically moves to Recent Meetings on end

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.x | React framework and routing |
| React | 18.x | UI component library |
| Tailwind CSS | 3.x | Styling and responsive design |
| Axios | Latest | HTTP API requests |
| Socket.io Client | Latest | Real-time WebSocket events |
| WebRTC | Native | Peer-to-peer video and audio |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.12 | Programming language |
| FastAPI | Latest | REST API framework |
| SQLAlchemy | Latest | Database ORM |
| SQLite | Built-in | Lightweight file database |
| python-socketio | Latest | Real-time Socket.io server |
| Uvicorn | Latest | ASGI production server |

---

## 🗄️ Database Schema

### Meetings Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | Integer | Primary Key | Auto-increment ID |
| meeting_id | String | Unique, Indexed | 9-char unique meeting code |
| title | String | Not Null | Meeting title |
| description | String | Nullable | Optional description |
| host_name | String | Default: Nikhil | Host display name |
| password | String | Nullable | Optional password |
| is_instant | Boolean | Default: False | Instant meeting flag |
| scheduled_time | DateTime | Nullable | Scheduled date/time |
| duration | Integer | Nullable | Duration in minutes |
| invite_link | String | Unique | Full shareable URL |
| created_at | DateTime | Auto | Creation timestamp |
| is_active | Boolean | Default: True | Meeting status |

### Participants Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | Integer | Primary Key | Auto-increment ID |
| meeting_id | String | Foreign Key | Links to meetings table |
| display_name | String | Not Null | Participant name |
| joined_at | DateTime | Auto | Join timestamp |
| is_host | Boolean | Default: False | Host flag |

---

## 🏗️ System Architecture


<img width="1024" height="1536" alt="image" src="https://github.com/user-attachments/assets/ed1d541c-e896-4613-a476-ee442d63fe9d" />



---

## 📁 Project Structure


<img width="1870" height="983" alt="Screenshot 2026-06-29 094106" src="https://github.com/user-attachments/assets/a3c34d75-3570-4d89-bbfc-2130f9aefa45" />



---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18 or higher
- Python 3.10 or higher
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/m-akanksha49/zoom-clone.git
cd zoom-clone
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed sample data
python seed.py

# Start backend server
uvicorn main:socket_app --reload --port 8000
```

- Backend runs at: `http://127.0.0.1:8000`
- API Docs at: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- Frontend runs at: `http://localhost:3000`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/meetings/` | Get all meetings |
| POST | `/meetings/` | Create a new meeting |
| GET | `/meetings/{id}` | Get single meeting details |
| POST | `/meetings/{id}/join` | Join a meeting |
| POST | `/meetings/{id}/end` | End meeting for all |
| GET | `/meetings/{id}/participants` | Get all participants |

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `join_room` | Client → Server | Join a meeting room |
| `existing_users` | Server → Client | Users already in room |
| `user_joined` | Server → Client | New user joined |
| `offer` | Client → Server | WebRTC offer |
| `answer` | Client → Server | WebRTC answer |
| `ice_candidate` | Client ↔ Server | ICE candidate exchange |
| `user_left` | Server → Client | User disconnected |
| `send_message` | Client → Server | Send chat message |
| `receive_message` | Server → Client | Receive chat message |
| `send_reaction` | Client → Server | Send emoji reaction |
| `receive_reaction` | Server → Client | Receive emoji reaction |
| `meeting_ended` | Server → Client | Host ended the meeting |

---

## 💡 Assumptions Made

- Default user (Nikhil) is assumed logged in — no authentication required per assignment spec
- Instant meetings do not appear in Upcoming Meetings (they start immediately)
- Only scheduled meetings appear in the Upcoming Meetings section
- Meeting moves to Recent Meetings only when host clicks End Meeting
- WebRTC works on local network and same-network devices
- For production WebRTC across the internet, a TURN server would be needed
- SQLite chosen as specified in assignment requirements
- Sample data seeded via `seed.py` script

---

## 🚀 Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Netlify | https://zooom-clone.netlify.app |
| Backend | Render | https://zoom-clone-backend-otem.onrender.com |

---

## 🔮 Future Enhancements

- User authentication with JWT (Login / Signup / OTP)
- TURN server integration for cross-network WebRTC
- Screen sharing with WebRTC getDisplayMedia
- Meeting recording and playback
- Virtual backgrounds
- Waiting room feature
- Host controls (mute all, remove participant)
- Mobile responsive design improvements

---

## 👩‍💻 Developer

**Akanksha M** — B.Tech Information Technology

- GitHub: https://github.com/m-akanksha49
- Live App: https://zooom-clone.netlify.app
- Repository: https://github.com/m-akanksha49/zoom-clone

---

## 📄 License

This project was built as an original SDE Fullstack Assignment submission.
All code is written from scratch — no plagiarism from existing repositories.
