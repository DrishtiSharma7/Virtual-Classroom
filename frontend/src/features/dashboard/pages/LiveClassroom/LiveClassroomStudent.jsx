import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  GraduationCap,
  Circle,
  Clock,
  BarChart3,
  Dot,
  Bell,
  Settings,
  Pencil,
  Eraser,
  Square,
  Circle as CircleIcon,
  MoveUpRight,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Pipette,
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  ClipboardList,
  Edit3,
  MessageCircle,
  FileText,
  Camera,
  ScreenShare,
  PencilRuler,
  Presentation,
  Vote,
  DoorOpen,
  ThumbsUp,
  Smile,
  Paperclip,
  Send,
  RefreshCcw,
} from "lucide-react";

import { getSession, leaveSession } from "../../../auth/api/session.api";
import { getChatHistory } from "../../../classroom/api/chat.api";

/* ---------------- Helpers ---------------- */

const drawElement = (ctx, el) => {
  if (!el) return;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (el.type === "path") {
    if (!el.points || el.points.length < 2) return;
    ctx.strokeStyle = el.eraser ? "#ffffff" : el.color;
    ctx.lineWidth = el.size;
    ctx.beginPath();
    ctx.moveTo(el.points[0][0], el.points[0][1]);
    for (let i = 1; i < el.points.length; i++) {
      ctx.lineTo(el.points[i][0], el.points[i][1]);
    }
    ctx.stroke();
  } else if (el.type === "rect") {
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.size;
    ctx.strokeRect(
      Math.min(el.x1, el.x2),
      Math.min(el.y1, el.y2),
      Math.abs(el.x2 - el.x1),
      Math.abs(el.y2 - el.y1)
    );
  } else if (el.type === "circle") {
    ctx.strokeStyle = el.color;
    ctx.lineWidth = el.size;
    const rx = Math.abs(el.x2 - el.x1) / 2;
    const ry = Math.abs(el.y2 - el.y1) / 2;
    const cx = (el.x1 + el.x2) / 2;
    const cy = (el.y1 + el.y2) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx || 0.01, ry || 0.01, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (el.type === "arrow") {
    const { x1, y1, x2, y2 } = el;
    ctx.strokeStyle = el.color;
    ctx.fillStyle = el.color;
    ctx.lineWidth = el.size;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 10 + el.size;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLen * Math.cos(angle - Math.PI / 6),
      y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headLen * Math.cos(angle + Math.PI / 6),
      y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  } else if (el.type === "text") {
    ctx.fillStyle = el.color;
    ctx.font = "18px sans-serif";
    ctx.fillText(el.text, el.x1, el.y1);
  }
};

const avatarFor = (name = "?") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;

const formatClock = (seconds) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const rtcConfig = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
};

// Demo quiz state shown while waiting on the live "active-quiz" socket event.
const demoQuiz = {
  question: "What is the derivative of x^2?",
  options: [
    { id: "a", label: "2c" },
    { id: "b", label: "2x" },
    { id: "c", label: "x" },
    { id: "d", label: "x^2/2" },
  ],
  timeLeft: "01:33",
};

/* ---------------- Reusable Pieces ---------------- */

const SidebarIcon = ({ Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
      active
        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/30"
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    }`}
  >
    <Icon size={20} />
  </button>
);

const ToolbarButton = ({
  Icon,
  active,
  colorDot,
  onClick,
  disabled,
  title,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
      active ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    {colorDot ? (
      <span
        className="h-5 w-5 rounded-full border border-black/10"
        style={{ backgroundColor: colorDot }}
      />
    ) : (
      <Icon size={18} />
    )}
  </button>
);

const BottomControl = ({ Icon, label, active, danger, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors ${
      danger
        ? "text-red-500"
        : active
          ? "bg-indigo-50 text-indigo-600"
          : "text-slate-600 hover:bg-slate-100"
    }`}
  >
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full ${
        danger
          ? "bg-red-100 text-red-500"
          : active
            ? "bg-indigo-100 text-indigo-600"
            : "bg-slate-100 text-slate-600"
      }`}
    >
      <Icon size={17} />
    </span>
    {label}
  </button>
);

const RemoteVideo = ({ stream, name, isTeacher }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`overflow-hidden rounded-xl bg-black shadow-sm ${
        isTeacher ? "col-span-2 ring-2 ring-indigo-500" : ""
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full object-cover ${isTeacher ? "h-40" : "h-24"}`}
      />
      <div className="flex items-center justify-between truncate bg-slate-900 p-1 text-[10px] text-white">
        <span className="truncate">{name || "Participant"}</span>
        {isTeacher && (
          <span className="ml-1 shrink-0 rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-semibold">
            Teacher
          </span>
        )}
      </div>
    </div>
  );
};

/* ---------------- Main Component ---------------- */

export default function LiveClassroomStudent() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const [rightTab, setRightTab] = useState("participants");

  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnections = useRef({});
  const pendingCandidates = useRef({});
  const localStream = useRef(null);
  const screenStream = useRef(null);

  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);

  const [connected, setConnected] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState("");

  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const [cameraDevices, setCameraDevices] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const ctxRef = useRef(null);
  const colorInputRef = useRef(null);
  const elementsRef = useRef([]);
  const redoRef = useRef([]);
  const drawStateRef = useRef({ isDrawing: false, current: null });
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#1e293b");
  const [historyTick, setHistoryTick] = useState(0);
  const bumpHistory = useCallback(() => setHistoryTick((t) => t + 1), []);

  // Live quiz pushed by the teacher over the socket. Falls back to a
  // placeholder question so the panel has something to render before the
  // first "active-quiz" event arrives.
  const [activeQuiz, setActiveQuiz] = useState(demoQuiz);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const teacherParticipant = participants.find(
    (p) => p.user?.role === "teacher"
  );

  /* ---- Load the session tied to this classroom (never a hardcoded room) ---- */
  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        setSessionLoading(true);
        const res = await getSession(sessionId);
        if (!cancelled) setSession(res.data);
      } catch (err) {
        if (!cancelled) {
          setSessionError(
            err.response?.data?.message || "Unable to load this session."
          );
        }
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    };

    if (sessionId) loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  /* ---- Load prior chat history for this session ---- */
  useEffect(() => {
    if (!sessionId) return;

    getChatHistory(sessionId)
      .then((history) => setMessages(history))
      .catch((err) => console.log("Chat history error:", err));
  }, [sessionId]);

  /* ---- Live session clock ---- */
  useEffect(() => {
    if (!session?.startTime) return;

    const start = new Date(session.startTime).getTime();
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.startTime]);

  /* ---- Local camera / mic ---- */
  useEffect(() => {
    let cancelled = false;

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStream.current = stream;

        const [track] = stream.getVideoTracks();
        if (track) setActiveCameraId(track.getSettings().deviceId || null);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.log(err);
        if (!cancelled) setMediaError("Camera/microphone unavailable.");
      } finally {
        if (!cancelled) setMediaReady(true);
      }
    };

    initMedia();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- List available cameras (labels only show up once permission is granted) ---- */
  useEffect(() => {
    if (!mediaReady || !navigator.mediaDevices?.enumerateDevices) return;

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        setCameraDevices(devices.filter((d) => d.kind === "videoinput"));
      })
      .catch((err) => console.log(err));
  }, [mediaReady]);

  /* ---- Peer connection factory, keyed by the remote socket id ---- */
  const createPeerConnection = useCallback(
    (targetId) => {
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnections.current[targetId] = pc;

      localStream.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStream.current);
      });

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;

        socketRef.current?.emit("ice-candidate", {
          roomId: sessionId,
          target: targetId,
          candidate: event.candidate,
        });
      };

      pc.ontrack = (event) => {
        setParticipants((prev) =>
          prev.map((p) =>
            p.socketId === targetId ? { ...p, stream: event.streams[0] } : p
          )
        );
      };

      return pc;
    },
    [sessionId]
  );

  const flushQueuedCandidates = async (peerId, pc) => {
    const queued = pendingCandidates.current[peerId];
    if (!queued?.length) return;

    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.log(err);
      }
    }

    pendingCandidates.current[peerId] = [];
  };

  /* ---- Whiteboard canvas (view + draw, same shared board as the teacher) ---- */
  const redrawCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const ratio = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    elementsRef.current.forEach((el) => drawElement(ctx, el));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvasWrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;

      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      ctx.scale(ratio, ratio);
      ctxRef.current = ctx;
      redrawCanvas();
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [redrawCanvas]);

  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return [clientX - rect.left, clientY - rect.top];
  };

  const commitElement = useCallback(
    (el) => {
      elementsRef.current.push(el);
      redoRef.current = [];
      redrawCanvas();
      bumpHistory();
      socketRef.current?.emit("draw", { roomId: sessionId, element: el });
    },
    [sessionId, redrawCanvas, bumpHistory]
  );

  const handlePointerDown = (e) => {
    const [x, y] = getCanvasPos(e);

    if (tool === "text") {
      const text = window.prompt("Enter text");
      if (text && text.trim()) {
        commitElement({
          id: `${socketRef.current?.id || "local"}-${Date.now()}`,
          type: "text",
          color,
          size: 2,
          x1: x,
          y1: y,
          text: text.trim(),
        });
      }
      return;
    }

    drawStateRef.current.isDrawing = true;

    if (tool === "pen" || tool === "eraser") {
      drawStateRef.current.current = {
        id: `${socketRef.current?.id || "local"}-${Date.now()}`,
        type: "path",
        color,
        size: tool === "eraser" ? 22 : 3,
        eraser: tool === "eraser",
        points: [[x, y]],
      };
    } else {
      drawStateRef.current.current = {
        id: `${socketRef.current?.id || "local"}-${Date.now()}`,
        type: tool, // rect | circle | arrow
        color,
        size: 3,
        x1: x,
        y1: y,
        x2: x,
        y2: y,
      };
    }
  };

  const handlePointerMove = (e) => {
    if (!drawStateRef.current.isDrawing || !drawStateRef.current.current)
      return;

    const [x, y] = getCanvasPos(e);
    const current = drawStateRef.current.current;

    if (current.type === "path") {
      current.points.push([x, y]);
    } else {
      current.x2 = x;
      current.y2 = y;
    }

    redrawCanvas();
    if (ctxRef.current) drawElement(ctxRef.current, current);
  };

  const handlePointerUp = () => {
    const current = drawStateRef.current.current;
    drawStateRef.current.isDrawing = false;
    drawStateRef.current.current = null;

    if (!current) return;
    if (current.type === "path" && current.points.length < 2) return;

    commitElement(current);
  };

  const handleUndo = () => {
    const last = elementsRef.current.pop();
    if (!last) return;
    redoRef.current.push(last);
    redrawCanvas();
    bumpHistory();
  };

  const handleRedo = () => {
    const el = redoRef.current.pop();
    if (!el) return;
    elementsRef.current.push(el);
    redrawCanvas();
    bumpHistory();
  };

  const handleClearBoard = () => {
    // Students can still clear their own scratch marks locally; the shared
    // board reset is still broadcast so a mistaken stray mark by anyone can
    // be corrected collaboratively.
    elementsRef.current = [];
    redoRef.current = [];
    redrawCanvas();
    bumpHistory();
    socketRef.current?.emit("clear-board", sessionId);
  };

  /* ---- Socket connection + signaling, scoped to this session's room ---- */
  useEffect(() => {
    if (!sessionId) return;

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

    const socket = io(socketUrl, {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("connect_error", (err) =>
      console.error("Socket error:", err.message)
    );
    socket.on("disconnect", () => setConnected(false));

    // The server tells us who's already in this session's room; we initiate
    // the offer to each of them.
    socket.on("existing-participants", (existing) => {
      setParticipants((prev) => {
        const known = new Set(prev.map((p) => p.socketId));
        const additions = existing
          .filter((p) => !known.has(p.socketId))
          .map((p) => ({ socketId: p.socketId, user: p.user, stream: null }));
        return [...prev, ...additions];
      });

      existing.forEach(async ({ socketId }) => {
        const pc = createPeerConnection(socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { roomId: sessionId, target: socketId, offer });
      });
    });

    // Someone else joined after us - just track them for the UI; the peer
    // connection is created once their offer arrives.
    socket.on("user-joined", ({ socketId, user }) => {
      setParticipants((prev) =>
        prev.some((p) => p.socketId === socketId)
          ? prev
          : [...prev, { socketId, user, stream: null }]
      );
    });

    socket.on("offer", async ({ sender, offer }) => {
      const pc = createPeerConnection(sender);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushQueuedCandidates(sender, pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { roomId: sessionId, target: sender, answer });
    });

    socket.on("answer", async ({ sender, answer }) => {
      const pc = peerConnections.current[sender];
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await flushQueuedCandidates(sender, pc);
    });

    socket.on("ice-candidate", async ({ sender, candidate }) => {
      const pc = peerConnections.current[sender];

      if (!pc || !pc.remoteDescription) {
        pendingCandidates.current[sender] =
          pendingCandidates.current[sender] || [];
        pendingCandidates.current[sender].push(candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("user-left", ({ socketId }) => {
      peerConnections.current[socketId]?.close();
      delete peerConnections.current[socketId];
      delete pendingCandidates.current[socketId];
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user-typing", () => setPeerTyping(true));
    socket.on("user-stop-typing", () => setPeerTyping(false));

    socket.on("draw", ({ element }) => {
      if (!element) return;
      elementsRef.current.push(element);
      redrawCanvas();
      bumpHistory();
    });

    socket.on("clear-board", () => {
      elementsRef.current = [];
      redoRef.current = [];
      redrawCanvas();
      bumpHistory();
    });

    // Teacher launches or closes a poll for everyone in the room.
    socket.on("active-quiz", (quiz) => {
      setActiveQuiz(quiz);
      setSelectedOption(null);
      setQuizSubmitted(false);
    });

    socket.on("quiz-closed", () => {
      setActiveQuiz(null);
    });

    // Session ended by the teacher - send the student back to the classroom.
    socket.on("session-ended", () => {
      navigate(
        session?.classroom?._id
          ? `/classrooms/${session.classroom._id}`
          : "/classrooms"
      );
    });

    return () => {
      socket.emit("leave-call", { roomId: sessionId });
      socket.emit("leave-room", { roomId: sessionId });
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token, createPeerConnection, redrawCanvas, bumpHistory]);

  /* ---- Join this exact session's room once socket + media are ready ---- */
  useEffect(() => {
    if (!connected || !mediaReady || !socketRef.current || !sessionId) return;
    if (!currentUser) return;

    socketRef.current.emit("join-room", {
      roomId: sessionId,
      user: currentUser,
    });
    socketRef.current.emit("join-call", {
      roomId: sessionId,
      user: currentUser,
    });
  }, [connected, mediaReady, sessionId, currentUser]);

  /* ---- Cleanup local media + peer connections on unmount ---- */
  useEffect(() => {
    return () => {
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      localStream.current?.getTracks().forEach((t) => t.stop());
      screenStream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleCamera = () => {
    const track = localStream.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraEnabled(track.enabled);
  };

  const toggleMic = () => {
    const track = localStream.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
  };

  const replaceOutgoingVideoTrack = (track) => {
    Object.values(peerConnections.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      sender?.replaceTrack(track);
    });
  };

  /* ---- Switch to a different physical camera without dropping the call ---- */
  const switchCamera = async (deviceId) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      const newTrack = newStream.getVideoTracks()[0];

      const oldTrack = localStream.current?.getVideoTracks()[0];
      if (oldTrack) {
        localStream.current.removeTrack(oldTrack);
        oldTrack.stop();
      }
      localStream.current?.addTrack(newTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }

      if (!sharingScreen) {
        replaceOutgoingVideoTrack(newTrack);
      }

      setActiveCameraId(newTrack.getSettings().deviceId || deviceId);
      setCameraEnabled(true);
      setShowCameraMenu(false);
    } catch (err) {
      console.log(err);
    }
  };

  /* ---- Retry camera/mic permission after an earlier denial/error ---- */
  const retryCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStream.current = stream;

      const [track] = stream.getVideoTracks();
      if (track) setActiveCameraId(track.getSettings().deviceId || null);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      replaceOutgoingVideoTrack(track);
      setMediaError("");
      setCameraEnabled(true);
      setMicEnabled(true);
    } catch (err) {
      console.log(err);
      setMediaError("Camera/microphone unavailable.");
    }
  };

  const stopScreenShare = useCallback(() => {
    screenStream.current?.getTracks().forEach((t) => t.stop());
    screenStream.current = null;

    const camTrack = localStream.current?.getVideoTracks()[0] || null;
    replaceOutgoingVideoTrack(camTrack);

    if (localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
    }

    setSharingScreen(false);
  }, []);

  const startScreenShare = async () => {
    if (sharingScreen) {
      stopScreenShare();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = stream.getVideoTracks()[0];
      screenStream.current = stream;

      replaceOutgoingVideoTrack(screenTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setSharingScreen(true);
      screenTrack.onended = stopScreenShare;
    } catch (e) {
      console.log(e);
    }
  };

  const handleSendMessage = () => {
    const text = message.trim();
    if (!text || !socketRef.current) return;

    socketRef.current.emit("send-message", {
      sessionId,
      senderId: currentUser?.id,
      message: text,
    });

    socketRef.current.emit("stop-typing", sessionId);
    setMessage("");
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    socketRef.current?.emit("typing", sessionId);
  };

  const handleSubmitQuiz = () => {
    if (!selectedOption || !socketRef.current || !activeQuiz) return;

    socketRef.current.emit("submit-quiz-answer", {
      roomId: sessionId,
      optionId: selectedOption,
    });
    setQuizSubmitted(true);
  };

  const handleLeaveSession = async () => {
    try {
      setLeaving(true);
      await leaveSession(sessionId);
    } catch (err) {
      console.log(err);
    } finally {
      setLeaving(false);
      navigate(
        session?.classroom?._id
          ? `/classrooms/${session.classroom._id}`
          : "/classrooms"
      );
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100 text-slate-500">
        Loading session...
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-slate-100 text-slate-600">
        <p>{sessionError || "Session not found."}</p>
        <button
          onClick={() => navigate("/classrooms")}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Back to Classrooms
        </button>
      </div>
    );
  }

  const classroomName = session.classroom?.name || session.title;

  const formattedDateTime = session.startTime
    ? (() => {
        const d = new Date(session.startTime);
        const weekday = d.toLocaleDateString([], { weekday: "short" });
        const time = d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `${weekday}, ${d.getFullYear()}, ${time}`;
      })()
    : "";

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100 font-sans text-slate-800">
      {/* ---------- Top Bar ---------- */}
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GraduationCap className="text-slate-800" size={28} />
            <h1 className="text-lg font-bold text-slate-800">
              {classroomName}
            </h1>
            {session.status === "live" && (
              <span className="flex items-center gap-2 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                LIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            <Bell className="text-slate-500" size={20} />
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700">
                {currentUser?.name || "Guest"}
              </span>
              <img
                src={avatarFor(currentUser?.name)}
                alt={currentUser?.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3 pl-9 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock size={15} />
            {formatClock(elapsed)}
          </span>
          <Dot className="text-slate-300" size={16} />
          <span>Date &amp; Time • {formattedDateTime}</span>
          <Dot className="text-slate-300" size={16} />
          <span
            className={`flex items-center gap-1.5 ${
              connected ? "text-emerald-500" : "text-amber-500"
            }`}
          >
            <BarChart3 size={15} />
            {connected ? "excellent" : "reconnecting"}
          </span>
          {session.status === "live" && (
            <>
              <Dot className="text-slate-300" size={16} />
              <span className="flex items-center gap-1.5 text-red-500">
                <Circle size={9} fill="currentColor" />
                Recording
              </span>
            </>
          )}
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left icon rail - no Settings/admin icon for students */}
        <nav className="flex w-[72px] flex-col items-center gap-4 bg-slate-900 py-5">
          <SidebarIcon Icon={Edit3} active />
          <SidebarIcon Icon={Video} />
          <SidebarIcon
            Icon={Users}
            onClick={() => setRightTab("participants")}
          />
          <SidebarIcon Icon={ClipboardList} />
          <SidebarIcon Icon={FileText} />
          <SidebarIcon
            Icon={MessageCircle}
            onClick={() => setRightTab("chat")}
          />
          <SidebarIcon Icon={FileText} />
        </nav>

        {/* Center + Right */}
        <main className="flex flex-1 gap-4 overflow-hidden p-4">
          {/* Board column: whiteboard + controls stacked underneath it */}
          <div className="flex flex-1 flex-col gap-4 overflow-hidden">
            {/* Whiteboard */}
            <section className="relative flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                <div className="flex items-center gap-1">
                  <ToolbarButton
                    Icon={Pencil}
                    active={tool === "pen"}
                    onClick={() => setTool("pen")}
                    title="Pen"
                  />
                  <ToolbarButton
                    Icon={Eraser}
                    active={tool === "eraser"}
                    onClick={() => setTool("eraser")}
                    title="Eraser"
                  />
                  <ToolbarButton
                    Icon={Square}
                    active={tool === "rect"}
                    onClick={() => setTool("rect")}
                    title="Rectangle"
                  />
                  <ToolbarButton
                    Icon={CircleIcon}
                    active={tool === "circle"}
                    onClick={() => setTool("circle")}
                    title="Circle"
                  />
                  <ToolbarButton
                    Icon={MoveUpRight}
                    active={tool === "arrow"}
                    onClick={() => setTool("arrow")}
                    title="Arrow"
                  />
                  <ToolbarButton
                    Icon={Type}
                    active={tool === "text"}
                    onClick={() => setTool("text")}
                    title="Text"
                  />
                  <ToolbarButton
                    colorDot="#1e293b"
                    active={color === "#1e293b"}
                    onClick={() => setColor("#1e293b")}
                    title="Black"
                  />
                  <ToolbarButton
                    colorDot="#22c55e"
                    active={color === "#22c55e"}
                    onClick={() => setColor("#22c55e")}
                    title="Green"
                  />
                  <ToolbarButton
                    colorDot="#a855f7"
                    active={color === "#a855f7"}
                    onClick={() => setColor("#a855f7")}
                    title="Purple"
                  />
                  <ToolbarButton
                    Icon={Pipette}
                    onClick={() => colorInputRef.current?.click()}
                    title="Custom color"
                  />
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="hidden"
                  />
                  <ToolbarButton
                    Icon={Undo2}
                    onClick={handleUndo}
                    disabled={elementsRef.current.length === 0}
                    title="Undo"
                  />
                  <ToolbarButton
                    Icon={Redo2}
                    onClick={handleRedo}
                    disabled={redoRef.current.length === 0}
                    title="Redo"
                  />
                  <ToolbarButton
                    Icon={Trash2}
                    onClick={handleClearBoard}
                    title="Clear board"
                  />
                </div>
              </div>

              <div
                ref={canvasWrapRef}
                className="relative flex-1 overflow-hidden bg-white"
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                  className={`absolute inset-0 h-full w-full touch-none ${
                    tool === "text" ? "cursor-text" : "cursor-crosshair"
                  }`}
                />

                {/* Live Quiz Panel - student can only pick an option and submit */}
                {activeQuiz && (
                  <div className="absolute left-[71%] top-[40%] w-[280px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">
                        Live Quiz Panel
                      </h3>
                    </div>
                    <p className="mb-3 text-sm text-slate-600">
                      {activeQuiz.question}
                    </p>

                    <div className="mb-3 grid grid-cols-2 gap-2">
                      {activeQuiz.options.map((opt) => {
                        const isSelected = selectedOption === opt.id;
                        return (
                          <label
                            key={opt.id}
                            onClick={() =>
                              !quizSubmitted && setSelectedOption(opt.id)
                            }
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                              isSelected
                                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                : "border-slate-200 text-slate-600"
                            } ${quizSubmitted ? "cursor-not-allowed opacity-70" : ""}`}
                          >
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-500"
                                  : "border-slate-300"
                              }`}
                            >
                              {isSelected && (
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              )}
                            </span>
                            {opt.label}
                          </label>
                        );
                      })}
                    </div>

                    <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {quizSubmitted ? "Answer submitted" : "Pick an option"}
                      </span>
                      <span>{activeQuiz.timeLeft}</span>
                    </div>

                    <button
                      onClick={handleSubmitQuiz}
                      disabled={!selectedOption || quizSubmitted}
                      className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {quizSubmitted ? "Submitted" : "Submit"}
                    </button>
                  </div>
                )}
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-8 py-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-slate-200 bg-white p-1">
                  <BottomControl
                    Icon={micEnabled ? Mic : MicOff}
                    label="Mic"
                    active={micEnabled}
                    onClick={toggleMic}
                  />
                  <BottomControl
                    Icon={cameraEnabled ? Camera : VideoOff}
                    label="Camera"
                    active={cameraEnabled}
                    onClick={toggleCamera}
                  />
                  <BottomControl
                    Icon={ScreenShare}
                    label={sharingScreen ? "Stop Sharing" : "Share Screen"}
                    active={sharingScreen}
                    onClick={startScreenShare}
                  />
                  <BottomControl Icon={PencilRuler} label="Tools" active />
                  <BottomControl Icon={Presentation} label="Materials" />
                  <BottomControl Icon={Vote} label="Polls" />
                  <BottomControl Icon={ThumbsUp} label="Feedback" />
                </div>

                <div className="rounded-2xl bg-red-50 p-1.5">
                  <BottomControl
                    Icon={DoorOpen}
                    label={leaving ? "..." : "Leave Session"}
                    danger
                    onClick={handleLeaveSession}
                  />
                </div>
              </div>
            </div>
          </div>

          <aside className="flex w-[340px] flex-shrink-0 flex-col gap-4 overflow-hidden">
            <div className="flex flex-[2] flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setRightTab("participants")}
                  className={`flex-1 py-3 text-sm font-semibold ${
                    rightTab === "participants"
                      ? "border-b-2 border-indigo-600 text-indigo-600"
                      : "text-slate-400"
                  }`}
                >
                  Participants
                </button>
                <button
                  onClick={() => setRightTab("chat")}
                  className={`flex-1 py-3 text-sm font-semibold ${
                    rightTab === "chat"
                      ? "border-b-2 border-indigo-600 text-indigo-600"
                      : "text-slate-400"
                  }`}
                >
                  Chat Panel
                </button>
              </div>

              {rightTab === "participants" ? (
                <div className="flex-1 overflow-y-auto p-4">
                  <h4 className="mb-3 text-sm font-bold text-slate-800">
                    Participants
                  </h4>
                  <div className="space-y-3">
                    {/* You - no management controls, students can't mute/manage anyone */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarFor(currentUser?.name)}
                          alt={currentUser?.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {currentUser?.name || "You"}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-slate-400">
                            <Dot className="text-emerald-500" size={14} />
                            Online (You)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {micEnabled ? (
                          <Mic size={16} className="text-slate-400" />
                        ) : (
                          <MicOff size={16} className="text-red-400" />
                        )}
                        {cameraEnabled ? (
                          <Video size={16} className="text-slate-400" />
                        ) : (
                          <VideoOff size={16} className="text-red-400" />
                        )}
                      </div>
                    </div>

                    {participants.length === 0 && (
                      <p className="text-xs text-slate-400">
                        Waiting for others to join this session...
                      </p>
                    )}

                    {participants.map((p) => {
                      const isRowTeacher = p.user?.role === "teacher";
                      return (
                        <div
                          key={p.socketId}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={avatarFor(p.user?.name)}
                              alt={p.user?.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {p.user?.name || "Participant"}
                              </p>
                              <p className="flex items-center gap-1 text-xs text-slate-400">
                                {isRowTeacher ? (
                                  "Teacher"
                                ) : (
                                  <>
                                    <Dot
                                      className="text-emerald-500"
                                      size={14}
                                    />
                                    Online
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mic size={16} className="text-slate-400" />
                            <Video size={16} className="text-slate-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col overflow-hidden">
                  <h4 className="px-4 pt-4 text-sm font-bold text-slate-800">
                    Chat
                  </h4>
                  <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                    {messages.map((m) => {
                      const mine =
                        (m.sender?._id || m.sender) === currentUser?.id;
                      return (
                        <div
                          key={m._id || m.id}
                          className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                        >
                          {!mine && (
                            <span className="mb-0.5 text-[10px] font-medium text-slate-400">
                              {m.sender?.name || "Participant"}
                            </span>
                          )}
                          <div
                            className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                              mine
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {m.message}
                          </div>
                          {m.createdAt && (
                            <span className="mt-1 text-[10px] text-slate-400">
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {peerTyping && (
                      <p className="text-xs italic text-slate-400">
                        Someone is typing...
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-100 p-3">
                    <Smile size={18} className="text-slate-400" />
                    <input
                      type="text"
                      value={message}
                      onChange={handleMessageChange}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Ask a question..."
                      className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 outline-none placeholder:text-slate-400"
                    />
                    <Paperclip size={18} className="text-slate-400" />
                    <button
                      onClick={handleSendMessage}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Camera panel - self + everyone else, teacher's tile highlighted */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-sm">
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                <Camera size={16} />
                Camera
              </h4>
              <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto">
                {teacherParticipant && (
                  <RemoteVideo
                    key={teacherParticipant.socketId}
                    stream={teacherParticipant.stream}
                    name={teacherParticipant.user?.name}
                    isTeacher
                  />
                )}

                <div className="relative overflow-hidden rounded-xl bg-black shadow-sm">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`h-24 w-full origin-center object-cover [transform:scaleX(-1)] ${
                      cameraEnabled ? "" : "opacity-0"
                    }`}
                  />

                  {!cameraEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                      <img
                        src={avatarFor(currentUser?.name)}
                        alt={currentUser?.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </div>
                  )}

                  {mediaError && (
                    <button
                      onClick={retryCamera}
                      className="absolute right-1 top-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 hover:bg-white"
                    >
                      Retry
                    </button>
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-900/80 px-1.5 py-1 text-[10px] text-white">
                    <span className="truncate">
                      You {mediaError ? "(no camera)" : ""}
                    </span>
                    {cameraDevices.length > 1 && (
                      <button
                        onClick={() => setShowCameraMenu((v) => !v)}
                        title="Switch camera"
                        className="ml-1 shrink-0 rounded p-0.5 hover:bg-white/20"
                      >
                        <RefreshCcw size={11} />
                      </button>
                    )}
                  </div>

                  {showCameraMenu && cameraDevices.length > 1 && (
                    <div className="absolute bottom-6 right-1 z-10 w-32 rounded-lg bg-white p-1 text-[11px] text-slate-700 shadow-lg">
                      {cameraDevices.map((d, i) => (
                        <button
                          key={d.deviceId}
                          onClick={() => switchCamera(d.deviceId)}
                          className={`block w-full truncate rounded px-2 py-1 text-left hover:bg-slate-100 ${
                            activeCameraId === d.deviceId
                              ? "bg-indigo-50 text-indigo-600"
                              : ""
                          }`}
                        >
                          {d.label || `Camera ${i + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {participants
                  .filter((p) => p.socketId !== teacherParticipant?.socketId)
                  .map((p) => (
                    <RemoteVideo
                      key={p.socketId}
                      stream={p.stream}
                      name={p.user?.name}
                    />
                  ))}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}