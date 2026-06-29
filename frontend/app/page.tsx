"use client";
import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = "https://zoom-clone-backend-otem.onrender.com";
axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

const HOST_NAME = "Nikhil";

export default function Home() {
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showMeetingCreated, setShowMeetingCreated] = useState(false);
  const [newMeeting, setNewMeeting] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingIdInput, setMeetingIdInput] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    description: "",
    scheduled_time: "",
    duration: 60,
  });
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/meetings/`);
      const all: any[] = res.data;

      // Upcoming = scheduled (NOT instant), still active, with a future/current scheduled time
      const upcoming = all.filter(
        (m) => !m.is_instant && m.is_active
      );

      // Recent = ended meetings (is_active = false)
      const recent = all.filter((m) => !m.is_active);

      setUpcomingMeetings(upcoming);
      setRecentMeetings(recent);
    } catch (err) {
      console.error("Error fetching meetings", err);
    }
  };

  const createInstantMeeting = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/meetings/`, {
        title: "Instant Meeting",
        is_instant: true,
      });
      const meeting = res.data;
      setNewMeeting(meeting);
      setShowMeetingCreated(true);
      // Don't add instant meetings to upcoming — go directly to room
    } catch (err) {
      console.error("Error creating meeting", err);
    }
  };

  const joinMeeting = async () => {
    if (!meetingIdInput || !displayName) {
      alert("Please enter both Meeting ID and your name!");
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/meetings/${meetingIdInput}/join`, {
        display_name: displayName,
      });
      window.location.href = `/meeting/${meetingIdInput}?name=${encodeURIComponent(displayName)}`;
    } catch (err) {
      alert("Meeting not found! Check the Meeting ID.");
    }
  };

  const scheduleMeeting = async () => {
    if (!scheduleForm.title || !scheduleForm.scheduled_time) {
      alert("Please enter title and date/time!");
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/meetings/`, {
        ...scheduleForm,
        is_instant: false,
      });
      setShowScheduleModal(false);
      setScheduleForm({ title: "", description: "", scheduled_time: "", duration: 60 });
      setScheduleSuccess(true);
      setTimeout(() => setScheduleSuccess(false), 3000);
      fetchMeetings(); // Refresh to show in upcoming
    } catch (err) {
      console.error("Error scheduling meeting", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 text-white w-8 h-8 rounded flex items-center justify-center font-bold text-lg">Z</div>
          <span className="text-xl font-semibold text-gray-800">Zoom</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-600 text-sm font-medium">{HOST_NAME}</span>
          <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {HOST_NAME[0]}
          </div>
        </div>
      </nav>

      {/* Success toast */}
      {scheduleSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          ✅ Meeting Scheduled Successfully!
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <button
            onClick={createInstantMeeting}
            className="flex flex-col items-center gap-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-2xl p-6 transition group"
          >
            <div className="w-14 h-14 bg-orange-500 group-hover:bg-orange-600 rounded-full flex items-center justify-center text-white text-2xl transition">
              📹
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-sm">New Meeting</p>
              <p className="text-gray-500 text-xs mt-1">Start instantly</p>
            </div>
          </button>

          <button
            onClick={() => setShowJoinModal(true)}
            className="flex flex-col items-center gap-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl p-6 transition group"
          >
            <div className="w-14 h-14 bg-blue-500 group-hover:bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl transition">
              ➕
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-sm">Join</p>
              <p className="text-gray-500 text-xs mt-1">Via ID or link</p>
            </div>
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex flex-col items-center gap-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl p-6 transition group"
          >
            <div className="w-14 h-14 bg-blue-500 group-hover:bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl transition">
              🗓️
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-sm">Schedule</p>
              <p className="text-gray-500 text-xs mt-1">Plan ahead</p>
            </div>
          </button>

          <button className="flex flex-col items-center gap-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl p-6 transition group">
            <div className="w-14 h-14 bg-green-500 group-hover:bg-green-600 rounded-full flex items-center justify-center text-white text-2xl transition">
              🖥️
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-sm">Share Screen</p>
              <p className="text-gray-500 text-xs mt-1">Present content</p>
            </div>
          </button>
        </div>

        {/* Upcoming Meetings — only scheduled (non-instant) active meetings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Upcoming Meetings</h2>
            <span className="text-sm text-gray-400">{upcomingMeetings.length} meeting{upcomingMeetings.length !== 1 ? "s" : ""}</span>
          </div>
          {upcomingMeetings.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
              <div className="text-5xl mb-3">🗓️</div>
              <p className="text-gray-500 font-medium">No upcoming meetings</p>
              <p className="text-gray-400 text-sm mt-1">Schedule a meeting to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-gray-100 hover:border-blue-200 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                      🗓️
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{meeting.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {meeting.scheduled_time
                          ? new Date(meeting.scheduled_time).toLocaleString()
                          : "Scheduled"} · {meeting.duration} min
                      </p>
                      {meeting.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{meeting.description}</p>
                      )}
                      <p className="text-xs text-blue-500 mt-1 font-mono">ID: {meeting.meeting_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/meeting/${meeting.meeting_id}`);
                        alert("✅ Invite link copied!");
                      }}
                      className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm transition"
                    >
                      📋 Copy Link
                    </button>
                    <button
                      onClick={() => window.location.href = `/meeting/${meeting.meeting_id}?name=${encodeURIComponent(HOST_NAME)}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Meetings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Meetings</h2>
            <span className="text-sm text-gray-400">{recentMeetings.length} meeting{recentMeetings.length !== 1 ? "s" : ""}</span>
          </div>
          {recentMeetings.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
              <div className="text-5xl mb-3">🕐</div>
              <p className="text-gray-500 font-medium">No recent meetings</p>
              <p className="text-gray-400 text-sm mt-1">Ended meetings will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMeetings.map((meeting) => (
                <div key={meeting.id} className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                      🕐
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700">{meeting.title}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {meeting.scheduled_time
                          ? new Date(meeting.scheduled_time).toLocaleString()
                          : "Instant Meeting"} · {meeting.duration} min
                      </p>
                      <p className="text-xs text-gray-400 mt-1 font-mono">ID: {meeting.meeting_id}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
                    Ended
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Join a Meeting</h2>
            <p className="text-gray-500 text-sm mb-5">Enter a Meeting ID or paste an invite link</p>
            <input
              type="text"
              placeholder="Meeting ID or Invite Link"
              value={meetingIdInput}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes("/meeting/")) {
                  setMeetingIdInput(val.split("/meeting/")[1].split("?")[0]);
                } else {
                  setMeetingIdInput(val);
                }
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
            />
            <input
              type="text"
              placeholder="Your Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
            />
            {meetingIdInput && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 mb-4">
                <p className="text-blue-600 text-sm">Meeting ID: <span className="font-bold font-mono">{meetingIdInput}</span></p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowJoinModal(false); setMeetingIdInput(""); setDisplayName(""); }}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={joinMeeting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
              >
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Created Modal (instant meeting) */}
      {showMeetingCreated && newMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Meeting Ready!</h2>
              <p className="text-gray-500 text-sm mt-1">Share this with others to join</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Meeting ID</p>
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-800 text-xl font-mono tracking-widest">{newMeeting.meeting_id}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(newMeeting.meeting_id); alert("✅ Copied!"); }}
                  className="text-blue-500 text-sm hover:text-blue-600 font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Invite Link</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-blue-500 text-sm truncate">{`${window.location.origin}/meeting/${newMeeting.meeting_id}`}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/meeting/${newMeeting.meeting_id}`); alert("✅ Link Copied!"); }}
                  className="text-blue-500 text-sm hover:text-blue-600 font-medium shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMeetingCreated(false)}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => window.location.href = `/meeting/${newMeeting.meeting_id}?name=${encodeURIComponent(HOST_NAME)}`}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
              >
                Start Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Schedule a Meeting</h2>
            <p className="text-gray-500 text-sm mb-5">Set up a meeting for later</p>
            <input
              type="text"
              placeholder="Meeting Title *"
              value={scheduleForm.title}
              onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
            />
            <textarea
              placeholder="Description (optional)"
              value={scheduleForm.description}
              onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-none"
              rows={2}
            />
            <input
              type="datetime-local"
              value={scheduleForm.scheduled_time}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_time: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
            />
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={scheduleForm.duration}
              onChange={(e) => setScheduleForm({ ...scheduleForm, duration: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
              min={15}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={scheduleMeeting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
