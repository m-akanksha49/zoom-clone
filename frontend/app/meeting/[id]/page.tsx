"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = "https://zoom-clone-backend-otem.onrender.com";
axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

const EMOJIS = ["😀", "😂", "❤️", "👍", "👏", "🎉", "🔥", "😮", "😢", "😡"];

function getGridClass(n: number) {
  if (n === 1) return "grid-cols-1 grid-rows-1";
  if (n === 2) return "grid-cols-2 grid-rows-1";
  if (n === 3) return "grid-cols-2 grid-rows-2";
  if (n === 4) return "grid-cols-2 grid-rows-2";
  return "grid-cols-3 grid-rows-2";
}

function mainCount(total: number) {
  if (total <= 6) return total;
  return 5;
}

function VideoTile({
  stream, userName, isMuted = false, isVideoOff = false, isLocal = false,
}: {
  stream?: MediaStream | null; userName: string; isMuted?: boolean;
  isVideoOff?: boolean; isLocal?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const showVideo = stream && !isVideoOff;
  const avatarColor = isLocal
    ? "bg-blue-600"
    : ["bg-green-600", "bg-purple-600", "bg-pink-600", "bg-yellow-600", "bg-red-600"][userName.charCodeAt(0) % 5];

  return (
    <div className="relative bg-gray-800 rounded-2xl overflow-hidden flex items-center justify-center w-full h-full">
      {showVideo ? (
        <video ref={videoRef} autoPlay muted={isLocal} playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 w-full h-full">
          <div className={`w-20 h-20 ${avatarColor} rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg`}>
            {userName[0]?.toUpperCase()}
          </div>
          <p className="text-gray-400 text-sm">{isVideoOff ? "Camera Off" : "No Video"}</p>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-white text-xs font-medium truncate">
            {userName}{isLocal && <span className="text-blue-300 ml-1">(You)</span>}
          </span>
          {isMuted && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">🔇</span>}
        </div>
      </div>
    </div>
  );
}

function StripTile({
  stream, userName, isLocal = false, isMuted = false, isVideoOff = false,
}: {
  stream?: MediaStream | null; userName: string; isLocal?: boolean; isMuted?: boolean; isVideoOff?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const showVideo = stream && !isVideoOff;
  const avatarColor = isLocal
    ? "bg-blue-600"
    : ["bg-green-600", "bg-purple-600", "bg-pink-600", "bg-yellow-600", "bg-red-600"][userName.charCodeAt(0) % 5];

  return (
    <div className="relative bg-gray-800 rounded-xl overflow-hidden border-2 border-dashed border-gray-600 hover:border-blue-400 transition-colors" style={{ width: "100%", aspectRatio: "16/9" }}>
      {showVideo ? (
        <video ref={videoRef} autoPlay muted={isLocal} playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white text-lg font-bold`}>
            {userName[0]?.toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
        <div className="flex items-center justify-between">
          <span className="text-white text-xs truncate">{userName}{isLocal && " (You)"}</span>
          {isMuted && <span className="text-xs">🔇</span>}
        </div>
      </div>
    </div>
  );
}

// ─── PRE-JOIN LOBBY ───────────────────────────────────────────────────────────
function PreJoinLobby({
  userName,
  meetingId,
  onJoin,
}: {
  userName: string;
  meetingId: string;
  onJoin: (micOn: boolean, camOn: boolean) => void;
}) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [camError, setCamError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startPreview = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setPreviewStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCamError(true);
      }
    };

    startPreview();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Toggle video tracks on the preview stream
  useEffect(() => {
    previewStream?.getVideoTracks().forEach((t) => { t.enabled = camOn; });
  }, [camOn, previewStream]);

  // Toggle audio tracks on the preview stream
  useEffect(() => {
    previewStream?.getAudioTracks().forEach((t) => { t.enabled = micOn; });
  }, [micOn, previewStream]);

  const handleJoin = () => {
    // Stop preview — main component will start its own stream
    previewStream?.getTracks().forEach((t) => t.stop());
    onJoin(micOn, camOn);
  };

  const avatarColor = "bg-blue-600";

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-blue-500 text-white w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg">Z</div>
            <span className="text-white text-2xl font-bold">Ready to join?</span>
          </div>
          <p className="text-gray-400 text-sm">Meeting ID: <span className="text-gray-200 font-mono">{meetingId}</span></p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
          {/* Camera Preview */}
          <div className="w-full md:w-[520px]">
            <div className="relative bg-gray-800 rounded-2xl overflow-hidden aspect-video shadow-2xl">
              {!camError && camOn && previewStream ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full gap-3">
                  <div className={`w-24 h-24 ${avatarColor} rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-lg`}>
                    {userName[0]?.toUpperCase()}
                  </div>
                  <p className="text-gray-400 text-sm">{camError ? "Camera not available" : "Camera is off"}</p>
                </div>
              )}
              {/* Name label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                <span className="text-white text-sm font-medium">{userName}</span>
              </div>
            </div>

            {/* Mic / Cam toggle buttons below preview */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setMicOn((p) => !p)}
                className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl transition-all ${
                  micOn ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                <span className="text-2xl">{micOn ? "🎤" : "🔇"}</span>
                <span className="text-xs font-medium">{micOn ? "Mic On" : "Mic Off"}</span>
              </button>

              <button
                onClick={() => setCamOn((p) => !p)}
                disabled={camError}
                className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl transition-all ${
                  camError
                    ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                    : camOn
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                <span className="text-2xl">{camOn && !camError ? "📹" : "📵"}</span>
                <span className="text-xs font-medium">{camError ? "No Camera" : camOn ? "Cam On" : "Cam Off"}</span>
              </button>
            </div>
          </div>

          {/* Join Panel */}
          <div className="w-full md:w-64 flex flex-col gap-4">
            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h3 className="text-white font-semibold mb-1">Joining as</h3>
              <div className="flex items-center gap-3 mt-3">
                <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold`}>
                  {userName[0]?.toUpperCase()}
                </div>
                <span className="text-gray-200 font-medium">{userName}</span>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Microphone</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${micOn ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {micOn ? "ON" : "OFF"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Camera</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${camOn && !camError ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {camError ? "N/A" : camOn ? "ON" : "OFF"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleJoin}
              className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-blue-500/25"
            >
              Join Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MEETING ENDED MODAL ──────────────────────────────────────────────────────
function MeetingEndedModal({ onOk }: { onOk: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">📵</span>
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Meeting Ended</h2>
        <p className="text-gray-400 text-sm mb-8">The host has ended this meeting for everyone.</p>
        <button
          onClick={onOk}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-2xl font-semibold text-base transition"
        >
          OK, Go to Dashboard
        </button>
      </div>
    </div>
  );
}

// ─── MAIN MEETING ROOM ────────────────────────────────────────────────────────
export default function MeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const meetingId = params.id as string;
  const userName = searchParams.get("name") || "Guest";

  // Pre-join state
  const [joined, setJoined] = useState(false);
  const [startMicOn, setStartMicOn] = useState(true);
  const [startCamOn, setStartCamOn] = useState(true);

  // Meeting ended modal
  const [meetingEndedModal, setMeetingEndedModal] = useState(false);

  const [meeting, setMeeting] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [showReactEmojis, setShowReactEmojis] = useState(false);
  const [peerNames, setPeerNames] = useState<{ [sid: string]: string }>({});
  const [peerStreams, setPeerStreams] = useState<{ [sid: string]: MediaStream }>({});
  const [cameraError, setCameraError] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<{ [sid: string]: RTCPeerConnection }>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pendingPeers = useRef<{ sid: string; isInitiator: boolean }[]>([]);
  const streamReady = useRef(false);

  // Only start the real session after lobby
  useEffect(() => {
    if (!joined) return;
    fetchMeeting();
    initializeMedia();
    return () => cleanup();
  }, [joined]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
    }
  }, [isVideoOff]);

  const cleanup = () => {
    localStream.current?.getTracks().forEach((t) => t.stop());
    socketRef.current?.disconnect();
    Object.values(peersRef.current).forEach((p) => p.close());
  };

  const fetchMeeting = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/meetings/${meetingId}`);
      setMeeting(res.data);
    } catch {}
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      // Apply lobby choices immediately
      stream.getAudioTracks().forEach((t) => { t.enabled = startMicOn; });
      stream.getVideoTracks().forEach((t) => { t.enabled = startCamOn; });

      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      streamReady.current = true;

      // Sync UI state with lobby choices
      setIsMuted(!startMicOn);
      setIsVideoOff(!startCamOn);

      pendingPeers.current.forEach(({ sid, isInitiator }) => createPeer(sid, isInitiator));
      pendingPeers.current = [];
    } catch {
      setCameraError(true);
      streamReady.current = true;
    }
    initializeSocket();
  };

  const initializeSocket = () => {
    const socket = io(BACKEND_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_room", { room_id: meetingId, user_name: userName });
    });

    socket.on("existing_users", ({ users }: { users: string[] }) => {
      users.forEach((sid) => {
        if (streamReady.current) createPeer(sid, false);
        else pendingPeers.current.push({ sid, isInitiator: false });
      });
    });

    socket.on("introduce_yourself", ({ to }: { to: string }) => {
      socket.emit("my_identity", { to, user_name: userName });
    });

    socket.on("peer_identity", ({ from, user_name }: { from: string; user_name: string }) => {
      setPeerNames((prev) => ({ ...prev, [from]: user_name }));
    });

    socket.on("user_joined", ({ sid, user_name }: any) => {
      setPeerNames((prev) => ({ ...prev, [sid]: user_name }));
      if (streamReady.current) createPeer(sid, true);
      else pendingPeers.current.push({ sid, isInitiator: true });
    });

    socket.on("offer", async ({ offer, from }: any) => {
      const peer = createPeer(from, false);
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => {
          const alreadyAdded = peer.getSenders().some((s) => s.track?.kind === track.kind);
          if (!alreadyAdded) peer.addTrack(track, localStream.current!);
        });
      }
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", { answer, to: from });
    });

    socket.on("answer", async ({ answer, from }: any) => {
      const peer = peersRef.current[from];
      if (peer && peer.signalingState !== "stable") {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice_candidate", async ({ candidate, from }: any) => {
      const peer = peersRef.current[from];
      if (peer && candidate) {
        try { await peer.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      }
    });

    socket.on("user_left", ({ sid }: any) => {
      peersRef.current[sid]?.close();
      delete peersRef.current[sid];
      setPeerStreams((prev) => { const u = { ...prev }; delete u[sid]; return u; });
      setPeerNames((prev) => { const u = { ...prev }; delete u[sid]; return u; });
    });

    socket.on("receive_message", (msg: any) => {
      setChatMessages((prev) => [...prev, msg]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("receive_reaction", ({ emoji, sender }: any) => {
      setReaction(`${sender}: ${emoji}`);
      setTimeout(() => setReaction(null), 2500);
    });

    // ─── MEETING ENDED: show modal instead of alert ───
    socket.on("meeting_ended", () => {
      cleanup();
      setMeetingEndedModal(true);
    });
  };

  const createPeer = (remoteSid: string, isInitiator: boolean): RTCPeerConnection => {
    if (peersRef.current[remoteSid]) return peersRef.current[remoteSid];

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    peersRef.current[remoteSid] = peer;

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => peer.addTrack(track, localStream.current!));
    }

    peer.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("ice_candidate", { candidate: e.candidate, to: remoteSid });
      }
    };

    peer.ontrack = (e) => {
      if (e.streams?.[0]) setPeerStreams((prev) => ({ ...prev, [remoteSid]: e.streams[0] }));
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "failed") peer.restartIce();
    };

    if (isInitiator) {
      peer.onnegotiationneeded = async () => {
        try {
          if (peer.signalingState !== "stable") return;
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socketRef.current?.emit("offer", { offer: peer.localDescription, to: remoteSid });
        } catch (err) {
          console.error("Offer failed:", err);
        }
      };
    }

    return peer;
  };

  const toggleMute = () => {
    localStream.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((p) => !p);
  };

  const toggleVideo = () => {
    localStream.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsVideoOff((p) => !p);
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    const msg = {
      sender: userName,
      message: chatInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      room_id: meetingId,
    };
    setChatMessages((prev) => [...prev, msg]);
    socketRef.current.emit("send_message", msg);
    setChatInput("");
    setShowEmojis(false);
  };

  const sendReaction = (emoji: string) => {
    setReaction(`You: ${emoji}`);
    setTimeout(() => setReaction(null), 2500);
    socketRef.current?.emit("send_reaction", { emoji, sender: userName, room_id: meetingId });
    setShowReactEmojis(false);
  };

  const leaveMeeting = () => { cleanup(); router.push("/"); };

  const endMeetingForAll = async () => {
    if (!confirm("End the meeting for everyone?")) return;
    try { await axios.post(`${BACKEND_URL}/meetings/${meetingId}/end`); } catch {}
    cleanup();
    router.push("/");
  };

  // ── Show pre-join lobby ──
  if (!joined) {
    return (
      <PreJoinLobby
        userName={userName}
        meetingId={meetingId}
        onJoin={(micOn, camOn) => {
          setStartMicOn(micOn);
          setStartCamOn(camOn);
          setJoined(true);
        }}
      />
    );
  }

  type Participant = {
    id: string; name: string; stream: MediaStream | null;
    isLocal: boolean; isMuted: boolean; isVideoOff: boolean;
  };

  const allParticipants: Participant[] = [
    { id: "local", name: userName, stream: localStream.current, isLocal: true, isMuted, isVideoOff: isVideoOff || cameraError },
    ...Object.entries(peerNames).map(([sid, name]) => ({
      id: sid, name, stream: peerStreams[sid] ?? null, isLocal: false, isMuted: false, isVideoOff: false,
    })),
  ];

  const total = allParticipants.length;
  const mc = mainCount(total);
  const mainParticipants = allParticipants.slice(0, mc);
  const stripParticipants = allParticipants.slice(mc);
  const hasStrip = stripParticipants.length > 0;
  const isThree = total === 3;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Meeting Ended Modal */}
      {meetingEndedModal && (
        <MeetingEndedModal onOk={() => { setMeetingEndedModal(false); router.push("/"); }} />
      )}

      {/* Floating Reaction */}
      {reaction && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-black/80 text-white text-2xl px-6 py-3 rounded-full z-50 animate-bounce shadow-xl">
          {reaction}
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-gray-900 px-6 py-3 flex items-center justify-between border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 text-white w-8 h-8 rounded flex items-center justify-center font-bold">Z</div>
          <span className="text-white font-semibold">{meeting?.title || "Meeting Room"}</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 text-sm font-mono">{meetingId}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/meeting/${meetingId}`); alert("✅ Invite link copied!"); }}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
          >
            📋 Copy Invite
          </button>
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden p-3 gap-2">
          {total === 1 ? (
            <div className="flex-1 rounded-2xl overflow-hidden">
              <VideoTile stream={localStream.current} userName={userName} isLocal isMuted={isMuted} isVideoOff={isVideoOff || cameraError} />
            </div>
          ) : isThree ? (
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex flex-1 gap-2">
                {mainParticipants.slice(0, 2).map((p) => (
                  <div key={p.id} className="flex-1">
                    <VideoTile stream={p.stream} userName={p.name} isLocal={p.isLocal} isMuted={p.isMuted} isVideoOff={p.isVideoOff} />
                  </div>
                ))}
              </div>
              <div className="flex flex-1 justify-center">
                <div className="w-1/2">
                  <VideoTile stream={mainParticipants[2].stream} userName={mainParticipants[2].name} isLocal={mainParticipants[2].isLocal} isMuted={mainParticipants[2].isMuted} isVideoOff={mainParticipants[2].isVideoOff} />
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex-1 grid gap-2 ${getGridClass(Math.min(total, 6))}`} style={{ gridAutoRows: "1fr" }}>
              {mainParticipants.map((p) => (
                <VideoTile key={p.id} stream={p.stream} userName={p.name} isLocal={p.isLocal} isMuted={p.isMuted} isVideoOff={p.isVideoOff} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 shrink-0">
            <span>ID: <span className="text-gray-300 font-mono">{meetingId}</span></span>
            <span>·</span>
            <span>👥 {total} participant{total > 1 ? "s" : ""}</span>
            {hasStrip && <span>· <span className="text-blue-400">{stripParticipants.length} more →</span></span>}
          </div>
        </div>

        {hasStrip && !showParticipants && !showChat && (
          <div className="w-52 bg-gray-900 border-l border-gray-700 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-gray-700 shrink-0">
              <p className="text-gray-400 text-xs font-medium">More participants ({stripParticipants.length})</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {stripParticipants.map((p) => (
                <StripTile key={p.id} stream={p.stream} userName={p.name} isLocal={p.isLocal} isMuted={p.isMuted} isVideoOff={p.isVideoOff} />
              ))}
            </div>
          </div>
        )}

        {showParticipants && (
          <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Participants ({total})</h3>
              <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {allParticipants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-700 transition">
                  <div className={`w-10 h-10 ${p.isLocal ? "bg-blue-500" : "bg-green-500"} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                    {p.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{p.name}</p>
                    <p className={`text-xs ${p.isLocal ? "text-blue-400" : "text-gray-400"}`}>{p.isLocal ? "You · Host" : "Participant"}</p>
                  </div>
                  <span className="text-xs">{p.isMuted ? "🔇" : "🎤"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-sm">Meeting Chat</h3>
                <p className="text-gray-500 text-xs mt-0.5">Visible to everyone</p>
              </div>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
                  <span className="text-4xl">💬</span>
                  <p className="text-gray-500 text-sm">No messages yet</p>
                  <p className="text-gray-600 text-xs">Say hello! 👋</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMe = msg.sender === userName;
                  return (
                    <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && <span className="text-gray-400 text-xs mb-1 px-1 font-medium">{msg.sender}</span>}
                      <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-blue-500 text-white rounded-tr-sm" : "bg-gray-700 text-gray-200 rounded-tl-sm"}`}>
                        {msg.message}
                      </div>
                      <span className="text-gray-600 text-xs mt-1 px-1">{msg.time}</span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>
            {showEmojis && (
              <div className="px-4 py-3 border-t border-gray-700">
                <p className="text-gray-400 text-xs mb-2">Add emoji</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((emoji) => (
                    <button key={emoji} onClick={() => { setChatInput((p) => p + emoji); setShowEmojis(false); }} className="text-xl hover:bg-gray-600 p-1.5 rounded-lg transition">{emoji}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center gap-2 bg-gray-700 rounded-xl px-3 py-2.5">
                <button onClick={() => setShowEmojis(!showEmojis)} className={`text-xl transition ${showEmojis ? "text-yellow-400" : "text-gray-400 hover:text-white"}`}>😊</button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
                />
                <button onClick={sendMessage} disabled={!chatInput.trim()} className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${chatInput.trim() ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-600 text-gray-400 cursor-not-allowed"}`}>➤</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-900 border-t border-gray-700 px-6 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition ${isMuted ? "bg-red-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}>
              <span className="text-xl">{isMuted ? "🔇" : "🎤"}</span>
              <span className="text-xs">{isMuted ? "Unmute" : "Mute"}</span>
            </button>
            <button onClick={toggleVideo} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition ${isVideoOff ? "bg-red-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}>
              <span className="text-xl">{isVideoOff ? "📵" : "📹"}</span>
              <span className="text-xs">{isVideoOff ? "Start Video" : "Stop Video"}</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-gray-700 text-white hover:bg-gray-600 transition">
              <span className="text-xl">🖥</span>
              <span className="text-xs">Share Screen</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowReactEmojis(!showReactEmojis)} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition ${showReactEmojis ? "bg-yellow-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}>
                <span className="text-xl">😊</span>
                <span className="text-xs">React</span>
              </button>
              {showReactEmojis && (
                <div className="absolute bottom-16 left-0 bg-gray-800 border border-gray-600 rounded-2xl p-3 flex flex-wrap gap-2 w-52 z-50 shadow-2xl">
                  <p className="text-gray-400 text-xs w-full mb-1">Send a reaction</p>
                  {EMOJIS.map((emoji) => (
                    <button key={emoji} onClick={() => sendReaction(emoji)} className="text-2xl hover:bg-gray-700 p-1.5 rounded-xl transition">{emoji}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition ${showParticipants ? "bg-blue-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}>
              <span className="text-xl">👥</span>
              <span className="text-xs">People ({total})</span>
            </button>
            <button onClick={() => { setShowChat(!showChat); setShowParticipants(false); setUnreadCount(0); }} className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition ${showChat ? "bg-blue-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}>
              <span className="text-xl">💬</span>
              <span className="text-xs">Chat</span>
              {unreadCount > 0 && !showChat && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={leaveMeeting} className="border border-red-500 text-red-400 hover:bg-red-950 px-4 py-2 rounded-xl font-medium transition text-sm">Leave</button>
            <button onClick={endMeetingForAll} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition text-sm">End Meeting</button>
          </div>
        </div>
      </div>
    </div>
  );
}