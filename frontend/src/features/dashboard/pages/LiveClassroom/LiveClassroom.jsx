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
  Wifi,
  WifiOff,
  RefreshCcw,
  Highlighter,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";

import { getSession, endSession } from "../../../auth/api/session.api";
import { getChatHistory } from "../../../classroom/api/chat.api";
import TeacherQuizPanel from "../../../classroom/components/QuizPanel/TeacherQuizPanel";
import { getWhiteboard } from "../../../classroom/api/whiteboard.api";

/* ---------------- Helpers ---------------- */

const drawElement = (ctx, el) => {
  if (!el) return;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // Highlighter strokes (and any element carrying an explicit opacity)
  // render semi-transparent; everything else stays fully opaque. Reset
  // afterwards so one translucent stroke can't bleed into the next
  // element drawn on the same context.
  ctx.globalAlpha = el.opacity != null ? el.opacity : el.highlighter ? 0.35 : 1;

  if (el.type === "path") {
    if (!el.points || el.points.length < 2) {
      ctx.globalAlpha = 1;
      return;
    }
    ctx.strokeStyle = el.eraser ? "#ffffff" : el.color;
    ctx.lineWidth = el.size;
    ctx.beginPath();
    ctx.moveTo(el.points[0][0], el.points[0][1]);
    for (let i = 1; i < el.points.length; i++) {
      ctx.lineTo(el.points[i][0], el.points[i][1]);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
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
  ctx.globalAlpha = 1;
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

const RemoteVideo = ({ stream, name, large }) => {
  const videoRef = useRef(null);
  const hasVideo = !!stream && stream.getVideoTracks().length > 0;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-black shadow-sm ${
        large ? "aspect-video w-full" : ""
      }`}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full object-cover ${large ? "h-full" : "h-24"}`}
        />
      ) : (
        // Students never send video (one-way-video model), so a student's
        // tile — or the teacher's, before their offer/track has arrived —
        // falls back to an avatar instead of a blank black box.
        <div
          className={`flex items-center justify-center bg-slate-800 ${
            large ? "h-full" : "h-24"
          }`}
        >
          <img
            src={avatarFor(name)}
            alt={name}
            className={
              large ? "h-16 w-16 rounded-full" : "h-10 w-10 rounded-full"
            }
          />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 truncate bg-slate-900/80 p-1 text-[10px] text-white">
        {name || "Participant"}
      </div>
    </div>
  );
};

/* ---------------- Main Component ---------------- */

export default function LiveClassroom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const [rightTab, setRightTab] = useState("participants");
  const [showQuizPanel, setShowQuizPanel] = useState(false);

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
  const [ending, setEnding] = useState(false);

  const [cameraDevices, setCameraDevices] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const whiteboardSectionRef = useRef(null);
  const ctxRef = useRef(null);
  const colorInputRef = useRef(null);
  const elementsRef = useRef([]);
  // Redo is now server-authoritative (see the "redo" socket handler), so
  // this only tracks *whether* a redo is plausible for disabling the
  // button — the actual stack of undone elements lives on the backend,
  // shared by every participant.
  const hasRedoRef = useRef(false);
  const drawStateRef = useRef({ isDrawing: false, current: null });
  // Other participants' strokes that are still being dragged (not yet
  // committed on mouse-up). Keyed by element id so each remote pointer's
  // in-progress line renders and updates independently.
  const remoteLiveRef = useRef({});
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#1e293b");
  const [penSize, setPenSize] = useState(3); // bug #12: was hardcoded
  const [opacity, setOpacity] = useState(1);
  const [historyTick, setHistoryTick] = useState(0);
  const bumpHistory = useCallback(() => setHistoryTick((t) => t + 1), []);
  // Undo/Redo button enabled-state, derived from the refs *after* render
  // (in the effect below) rather than read directly during render, which
  // React flags as unsafe since ref mutations don't trigger re-renders on
  // their own.
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    setCanUndo(elementsRef.current.length > 0);
    setCanRedo(hasRedoRef.current);
  }, [historyTick]);

  // Whiteboard-specific state: kept deliberately separate from call state
  // (see the "connected" flag used for signaling) so a whiteboard hiccup
  // never gets confused in the UI with the video/audio call itself.
  const [allowStudentDraw, setAllowStudentDraw] = useState(false);
  const [wbZoom, setWbZoom] = useState(1);
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [wbError, setWbError] = useState("");

  const [removedNotice, setRemovedNotice] = useState("");
  const [forceMuted, setForceMuted] = useState(false);
  const [mutedParticipants, setMutedParticipants] = useState(() => new Set());

  const isHost =
    !!session &&
    !!currentUser &&
    (session.createdBy?._id === currentUser.id ||
      session.createdBy === currentUser.id);

  // Single source of truth for "can this participant currently draw":
  // the host always can; a student can only while the teacher has turned
  // on student annotation. The backend enforces the exact same rule
  // independently (see whiteboard.socket.js) — this is only for the UI.
  const canDraw = isHost || allowStudentDraw;

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

  /* ---- Local camera / mic ----
     One-way video model: only the host's camera is ever captured or sent.
     Students only ever request a microphone — no video track exists on
     their side at all, so there's nothing for a modified client to turn
     on even if the (removed) camera-toggle button were still reachable. */
  useEffect(() => {
    if (sessionLoading) return; // wait until we actually know isHost
    let cancelled = false;

    const initMedia = async () => {
      try {
        const constraints = isHost
          ? { video: true, audio: true }
          : { video: false, audio: true };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStream.current = stream;

        if (isHost) {
          const [track] = stream.getVideoTracks();
          if (track) setActiveCameraId(track.getSettings().deviceId || null);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } else {
          setCameraEnabled(false);
        }
      } catch (err) {
        console.log(err);
        if (!cancelled) {
          setMediaError(
            isHost
              ? "Camera/microphone unavailable."
              : "Microphone unavailable."
          );
        }
      } finally {
        if (!cancelled) setMediaReady(true);
      }
    };

    initMedia();

    return () => {
      cancelled = true;
    };
  }, [sessionLoading, isHost]);

  /* ---- List available cameras (host only — students never capture video) ---- */
  useEffect(() => {
    if (!isHost || !mediaReady || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        setCameraDevices(devices.filter((d) => d.kind === "videoinput"));
      })
      .catch((err) => console.log(err));
  }, [isHost, mediaReady]);

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

  /* ---- Whiteboard canvas: size it to its wrapper, keep it crisp on resize ---- */
  const redrawCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const ratio = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    elementsRef.current.forEach((el) => drawElement(ctx, el));
    // Live strokes other people are still dragging get painted on top,
    // so they're visible while moving instead of only after they let go.
    Object.values(remoteLiveRef.current).forEach((el) => drawElement(ctx, el));
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

  useEffect(() => {
    if (!sessionId) return;

    getWhiteboard(sessionId)
      .then(({ elements }) => {
        elementsRef.current = Array.isArray(elements) ? elements : [];
        // guard in case the canvas hasn't sized yet
        if (ctxRef.current) redrawCanvas();
        bumpHistory();
      })
      .catch((err) => console.log("Whiteboard history error:", err));
  }, [sessionId, redrawCanvas, bumpHistory]);

  // Divides out the current CSS zoom so drawing coordinates always map
  // back into the canvas's real (unscaled) pixel space, regardless of
  // what wbZoom the viewer currently has dialed in.
  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return [(clientX - rect.left) / wbZoom, (clientY - rect.top) / wbZoom];
  };

  const commitElement = useCallback(
    (el) => {
      // This is the actual choke point for outgoing draw events — guarding
      // it here (not just hiding the toolbar) means the socket emit is
      // unreachable for an unauthorized student even from a modified
      // client, since the pointer handlers below are also never attached
      // to the canvas for a non-permitted participant in the first place.
      // The backend re-checks the exact same permission independently.
      if (!canDraw) return;

      try {
        elementsRef.current.push(el);
        hasRedoRef.current = false; // a fresh action clears redo, everywhere
        redrawCanvas();
        bumpHistory();
        socketRef.current?.emit("draw", { roomId: sessionId, element: el });
      } catch (err) {
        console.error("Whiteboard draw error:", err);
        setWbError("Couldn't send that drawing action. Retrying...");
      }
    },
    [canDraw, sessionId, redrawCanvas, bumpHistory]
  );

  const handlePointerDown = (e) => {
    if (!canDraw) return;
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

    if (tool === "pen" || tool === "eraser" || tool === "highlighter") {
      drawStateRef.current.current = {
        id: `${socketRef.current?.id || "local"}-${Date.now()}`,
        type: "path",
        color,
        size: tool === "eraser" ? 22 : tool === "highlighter" ? 18 : penSize,
        eraser: tool === "eraser",
        highlighter: tool === "highlighter",
        opacity: tool === "highlighter" ? 0.35 : opacity,
        points: [[x, y]],
      };
    } else {
      drawStateRef.current.current = {
        id: `${socketRef.current?.id || "local"}-${Date.now()}`,
        type: tool, // rect | circle | arrow
        color,
        size: penSize,
        opacity,
        x1: x,
        y1: y,
        x2: x,
        y2: y,
      };
    }
  };

  const handlePointerMove = (e) => {
    if (!canDraw) return;
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

    // Stream the in-progress stroke to everyone else in the room so it's
    // visible while it's being drawn, not just once it's released. This
    // is fire-and-forget — losing an intermediate frame is harmless since
    // the final "draw" commit on pointer-up always lands the full stroke.
    socketRef.current?.emit("draw-preview", {
      roomId: sessionId,
      element: current,
    });
  };

  const handlePointerUp = () => {
    if (!canDraw) return;
    const current = drawStateRef.current.current;
    drawStateRef.current.isDrawing = false;
    drawStateRef.current.current = null;

    if (!current) return;

    // Tell everyone else this stroke is no longer "live" — the commit
    // below (or the resulting "draw" broadcast) supplies the final version.
    socketRef.current?.emit("draw-preview-end", {
      roomId: sessionId,
      id: current.id,
    });

    if (current.type === "path" && current.points.length < 2) return;

    commitElement(current);
  };

  // Undo/redo are shared, server-authoritative actions: the client just
  // asks the server to pop/restore the last element on the room's board,
  // and the resulting full board comes back over "board-sync" to every
  // participant (including this one) so everyone stays in lockstep even
  // when both teacher and students have been drawing.
  const handleUndo = () => {
    if (!canDraw || !canUndo) return;
    try {
      socketRef.current?.emit("undo", { roomId: sessionId });
    } catch (err) {
      console.error("Whiteboard undo error:", err);
    }
  };

  const handleRedo = () => {
    if (!canDraw) return;
    try {
      socketRef.current?.emit("redo", { roomId: sessionId });
    } catch (err) {
      console.error("Whiteboard redo error:", err);
    }
  };

  const handleClearBoard = () => {
    if (!isHost) return;
    if (!window.confirm("Are you sure you want to clear the whiteboard?")) {
      return;
    }
    try {
      elementsRef.current = [];
      hasRedoRef.current = false;
      redrawCanvas();
      bumpHistory();
      socketRef.current?.emit("clear-board", { roomId: sessionId });
    } catch (err) {
      console.error("Whiteboard clear error:", err);
    }
  };

  const toggleStudentDraw = () => {
    if (!isHost) return;
    const next = !allowStudentDraw;
    socketRef.current?.emit("set-draw-permission", {
      roomId: sessionId,
      allow: next,
    });
    // Optimistic — the authoritative "draw-permission-changed" broadcast
    // (which the teacher also receives) will confirm/correct this.
    setAllowStudentDraw(next);
  };

  const zoomIn = () => setWbZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setWbZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const resetZoom = () => setWbZoom(1);

  const toggleFullscreen = () => {
    const el = whiteboardSectionRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch((err) => console.error(err));
    } else {
      document.exitFullscreen?.().catch((err) => console.error(err));
    }
  };

  useEffect(() => {
    const onFsChange = () =>
      setWbFullscreen(
        document.fullscreenElement === whiteboardSectionRef.current
      );
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  /* ---- Socket connection + signaling, scoped to this session's room ---- */
  useEffect(() => {
    if (!sessionId) return;

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

    // NOTE on reliability: this one socket carries call signaling (offer/
    // answer/ICE), chat, and whiteboard events. Once two peers have an
    // established RTCPeerConnection, their actual audio/video keeps
    // flowing directly, peer-to-peer — it does NOT run through this
    // socket. So if this connection drops mid-call, the video/audio a
    // participant is already seeing and hearing is unaffected; only
    // whiteboard sync and *new* participants joining are paused until it
    // reconnects. Socket.IO reconnects with backoff automatically (config
    // below), and the "connected" flip back to true re-runs the join
    // effect, which re-requests the latest whiteboard state.
    const socket = io(socketUrl, {
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setWbError("");
    });
    socket.on("connect_error", (err) =>
      console.error("Socket error:", err.message)
    );
    socket.on("disconnect", () => setConnected(false));
    socket.on("reconnect_attempt", () =>
      setWbError("Reconnecting whiteboard...")
    );

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
      try {
        // The final version has landed — it no longer needs a live overlay.
        if (element.id) delete remoteLiveRef.current[element.id];
        elementsRef.current.push(element);
        redrawCanvas();
        bumpHistory();
      } catch (err) {
        // Isolated on purpose: a bad incoming whiteboard element must
        // never crash the classroom page, the call, or any other panel.
        console.error("Whiteboard render error:", err);
        setWbError("Had trouble rendering the last whiteboard update.");
      }
    });

    // Someone else's stroke, still being dragged — render it live instead
    // of waiting for them to release the mouse.
    socket.on("draw-preview", ({ element }) => {
      if (!element?.id) return;
      remoteLiveRef.current[element.id] = element;
      redrawCanvas();
    });

    socket.on("draw-preview-end", ({ id }) => {
      if (id) delete remoteLiveRef.current[id];
      redrawCanvas();
    });

    socket.on("clear-board", () => {
      elementsRef.current = [];
      remoteLiveRef.current = {};
      hasRedoRef.current = false;
      redrawCanvas();
      bumpHistory();
    });

    // Full-board replacement — used for the initial sync on join/reconnect,
    // and again after every shared undo/redo. The server is always the
    // source of truth here: we never merge this with whatever stale local
    // state we already had, we replace it outright, so a client that
    // missed individual events while disconnected still ends up correct.
    socket.on("board-sync", ({ elements, allowStudentDraw: allow }) => {
      elementsRef.current = Array.isArray(elements) ? elements : [];
      remoteLiveRef.current = {};
      // We don't know the exact depth of the server's redo stack from this
      // payload alone, so err on the side of letting Redo be clickable;
      // a redo with nothing queued is a harmless server-side no-op.
      hasRedoRef.current = true;
      if (typeof allow === "boolean") setAllowStudentDraw(allow);
      redrawCanvas();
      bumpHistory();
      setWbError("");
    });

    // Teacher toggled "Allow Students to Draw" — update every client's
    // toolbar/permissions immediately.
    socket.on("draw-permission-changed", ({ allowStudentDraw: allow }) => {
      setAllowStudentDraw(!!allow);
    });

    // Teacher muted this student's outgoing audio.
    socket.on("force-mute", () => {
      const track = localStream.current?.getAudioTracks()[0];
      if (track) track.enabled = false;
      setMicEnabled(false);
      setForceMuted(true);
    });

    // Reflects a muted participant in everyone's roster (used by the
    // teacher's participant list to show "Muted" / disable the button so
    // duplicate mute requests can't be sent indefinitely).
    socket.on("student-muted", ({ socketId }) => {
      setMutedParticipants((prev) => new Set(prev).add(socketId));
    });

    // Teacher removed this student from the session.
    socket.on("removed-from-session", ({ message }) => {
      setRemovedNotice(
        message || "You have been removed from this session by the host."
      );
    });

    socket.on("action-denied", ({ action, message }) => {
      console.warn("Action denied:", action, message);
      if (typeof action === "string" && action.startsWith("whiteboard")) {
        setWbError(message || "That whiteboard action isn't allowed.");
      }
    });

    return () => {
      socket.emit("leave-call", { roomId: sessionId });
      socket.emit("leave-room", { roomId: sessionId });
      socket.disconnect();
    };
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
    // Ask the server for whatever's already on the board so we don't start
    // from a blank canvas if we're joining mid-session.
    socketRef.current.emit("request-board-sync", sessionId);
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

  /* ---- Kicked: show the message, then leave the session ---- */
  useEffect(() => {
    if (!removedNotice) return;

    const timer = setTimeout(() => {
      navigate(
        session?.classroom?._id
          ? `/classrooms/${session.classroom._id}`
          : "/classrooms"
      );
    }, 2500);

    return () => clearTimeout(timer);
  }, [removedNotice, navigate, session]);

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
    if (track.enabled) setForceMuted(false);
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
      const stream = await navigator.mediaDevices.getUserMedia(
        isHost ? { video: true, audio: true } : { video: false, audio: true }
      );

      localStream.current = stream;

      if (isHost) {
        const [track] = stream.getVideoTracks();
        if (track) setActiveCameraId(track.getSettings().deviceId || null);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        replaceOutgoingVideoTrack(track);
        setCameraEnabled(true);
      }

      setMediaError("");
      setMicEnabled(true);
    } catch (err) {
      console.log(err);
      setMediaError(
        isHost ? "Camera/microphone unavailable." : "Microphone unavailable."
      );
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
    // Bug #4: this is the actual choke point, not just the button's
    // visibility — a non-host reaching this function is a no-op.
    if (!isHost) return;

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

  /* ---- Bug #5/#6: teacher-only participant controls ---- */
  const handleMuteStudent = (targetSocketId) => {
    if (!isHost || mutedParticipants.has(targetSocketId)) return;
    socketRef.current?.emit("mute-student", {
      roomId: sessionId,
      targetSocketId,
    });
  };

  const handleKickStudent = (targetSocketId) => {
    if (!isHost) return;
    if (!window.confirm("Remove this student from the session?")) return;

    socketRef.current?.emit("kick-student", {
      roomId: sessionId,
      targetSocketId,
    });

    peerConnections.current[targetSocketId]?.close();
    delete peerConnections.current[targetSocketId];
    setParticipants((prev) =>
      prev.filter((p) => p.socketId !== targetSocketId)
    );
  };

  const handleEndOrLeave = async () => {
    try {
      setEnding(true);
      if (isHost) {
        await endSession(sessionId);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setEnding(false);
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
  const classroomSubject = session.classroom?.subject;
  const classroomCode = session.classroom?.code;

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
    <div className="relative flex h-screen w-full flex-col bg-slate-100 font-sans text-slate-800">
      {removedNotice && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/70">
          <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <p className="text-sm font-medium text-slate-700">
              {removedNotice}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Redirecting you out of this session...
            </p>
          </div>
        </div>
      )}
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
        {/* Left icon rail */}
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
          <SidebarIcon Icon={BarChart3} />
          <div className="mt-auto">
            <SidebarIcon Icon={Settings} />
          </div>
        </nav>

        {/* Center + Right */}
        <main className="flex flex-1 gap-4 overflow-hidden p-4">
          {/* Board column: whiteboard + controls stacked underneath it */}
          <div className="flex flex-1 flex-col gap-4 overflow-hidden">
            {/* Whiteboard */}
            <section
              ref={whiteboardSectionRef}
              className={`relative flex flex-1 flex-col overflow-hidden bg-white shadow-sm ${
                wbFullscreen ? "" : "rounded-2xl"
              }`}
            >
              {/* Toolbar — visible to the host always, and to a student
                  only while the teacher has annotation turned on. It
                  wraps instead of disappearing on narrow/tablet widths
                  (never hides tools behind overflow). */}
              {canDraw && (
                <div className="flex flex-wrap items-center gap-y-2 justify-between border-b border-slate-100 px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <ToolbarButton
                      Icon={Pencil}
                      active={tool === "pen"}
                      onClick={() => setTool("pen")}
                      title="Pencil"
                    />
                    <ToolbarButton
                      Icon={Highlighter}
                      active={tool === "highlighter"}
                      onClick={() => setTool("highlighter")}
                      title="Highlighter"
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

                    <div className="ml-1 flex items-center gap-1 border-l border-slate-200 pl-2">
                      {[
                        ["#1e293b", "Black"],
                        ["#ef4444", "Red"],
                        ["#3b82f6", "Blue"],
                        ["#22c55e", "Green"],
                        ["#eab308", "Yellow"],
                        ["#a855f7", "Purple"],
                        ["#ffffff", "White"],
                      ].map(([hex, label]) => (
                        <ToolbarButton
                          key={hex}
                          colorDot={hex}
                          active={color === hex}
                          onClick={() => setColor(hex)}
                          title={label}
                        />
                      ))}
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
                    </div>

                    <div className="ml-1 flex items-center gap-1 border-l border-slate-200 pl-2">
                      <ToolbarButton
                        Icon={Undo2}
                        onClick={handleUndo}
                        disabled={!canUndo}
                        title="Undo"
                      />
                      <ToolbarButton
                        Icon={Redo2}
                        onClick={handleRedo}
                        disabled={!canRedo}
                        title="Redo"
                      />
                      {isHost && (
                        <ToolbarButton
                          Icon={Trash2}
                          onClick={handleClearBoard}
                          title="Clear board"
                        />
                      )}
                    </div>

                    {/* Stroke size: quick presets + fine slider */}
                    <div className="ml-1 flex items-center gap-1.5 border-l border-slate-200 pl-2">
                      <span className="text-[11px] font-medium text-slate-400">
                        Size
                      </span>
                      {[2, 4, 6, 10, 15, 20].map((s) => (
                        <button
                          key={s}
                          onClick={() => setPenSize(s)}
                          title={`${s}px`}
                          className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-medium transition-colors ${
                            penSize === s
                              ? "bg-indigo-600 text-white"
                              : "text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                      <input
                        type="range"
                        min={1}
                        max={30}
                        value={penSize}
                        onChange={(e) => setPenSize(Number(e.target.value))}
                        className="h-1 w-16 accent-indigo-600"
                        title={`Stroke size: ${penSize}`}
                      />
                    </div>

                    {/* Opacity — also drives highlighter transparency */}
                    <div className="ml-1 flex items-center gap-1.5 border-l border-slate-200 pl-2">
                      <span className="text-[11px] font-medium text-slate-400">
                        Opacity
                      </span>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="h-1 w-16 accent-indigo-600"
                        title={`Opacity: ${Math.round(opacity * 100)}%`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Teacher-only student-annotation permission switch */}
                    {isHost && (
                      <button
                        onClick={toggleStudentDraw}
                        title="Allow Students to Draw"
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          allowStudentDraw
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {allowStudentDraw ? (
                          <Unlock size={14} />
                        ) : (
                          <Lock size={14} />
                        )}
                        Students Draw: {allowStudentDraw ? "ON" : "OFF"}
                      </button>
                    )}

                    <div className="flex items-center gap-0.5 border-l border-slate-200 pl-2">
                      <ToolbarButton
                        Icon={ZoomOut}
                        onClick={zoomOut}
                        title="Zoom out"
                      />
                      <button
                        onClick={resetZoom}
                        title="Reset zoom"
                        className="w-10 rounded-md py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100"
                      >
                        {Math.round(wbZoom * 100)}%
                      </button>
                      <ToolbarButton
                        Icon={ZoomIn}
                        onClick={zoomIn}
                        title="Zoom in"
                      />
                      <ToolbarButton
                        Icon={wbFullscreen ? Minimize : Maximize}
                        onClick={toggleFullscreen}
                        title="Fullscreen"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Read-only banner for a student without draw permission —
                  never a full-screen error, the classroom stays usable. */}
              {!canDraw && (
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Lock size={13} /> View only — the host hasn&apos;t enabled
                    student drawing.
                  </span>
                  {!connected && (
                    <span className="flex items-center gap-1.5 text-amber-500">
                      <Loader2 size={13} className="animate-spin" />
                      Reconnecting whiteboard...
                    </span>
                  )}
                </div>
              )}

              {/* Small non-blocking whiteboard status strip. Shown whenever
                  the underlying socket is down or a whiteboard error was
                  reported — never a full-screen error, and it never
                  touches the call/video/audio controls. */}
              {canDraw && (!connected || wbError) && (
                <div className="flex items-center gap-1.5 border-b border-amber-100 bg-amber-50 px-4 py-1.5 text-xs text-amber-600">
                  <Loader2 size={13} className="animate-spin" />
                  {!connected
                    ? "Reconnecting whiteboard... your video/audio call is unaffected."
                    : wbError}
                </div>
              )}

              <div
                ref={canvasWrapRef}
                className="relative flex-1 overflow-hidden bg-white"
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={canDraw ? handlePointerDown : undefined}
                  onMouseMove={canDraw ? handlePointerMove : undefined}
                  onMouseUp={canDraw ? handlePointerUp : undefined}
                  onMouseLeave={canDraw ? handlePointerUp : undefined}
                  onTouchStart={canDraw ? handlePointerDown : undefined}
                  onTouchMove={canDraw ? handlePointerMove : undefined}
                  onTouchEnd={canDraw ? handlePointerUp : undefined}
                  style={{
                    transform: `scale(${wbZoom})`,
                    transformOrigin: "top left",
                  }}
                  className={`absolute inset-0 h-full w-full touch-none ${
                    !canDraw
                      ? "cursor-default"
                      : tool === "text"
                        ? "cursor-text"
                        : "cursor-crosshair"
                  }`}
                />
                {showQuizPanel && (
                  <div className="absolute left-[68%] top-[8%]">
                    <TeacherQuizPanel
                      socket={socketRef.current}
                      sessionId={sessionId}
                      classroomId={
                        session?.classroom?._id || session?.classroom
                      }
                      onClose={() => setShowQuizPanel(false)}
                    />
                  </div>
                )}
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-8 py-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-slate-200 bg-white p-1">
                  <BottomControl
                    Icon={micEnabled ? Mic : MicOff}
                    label={forceMuted && !micEnabled ? "Muted by host" : "Mic"}
                    active={micEnabled}
                    onClick={toggleMic}
                  />
                  {/* Camera + Share Screen are host-only in the one-way-video
                      model (bugs #4 and the new camera-off requirement) —
                      students never see these controls at all. */}
                  {isHost && (
                    <BottomControl
                      Icon={cameraEnabled ? Camera : VideoOff}
                      label="Camera"
                      active={cameraEnabled}
                      onClick={toggleCamera}
                    />
                  )}
                  {isHost && (
                    <BottomControl
                      Icon={ScreenShare}
                      label={sharingScreen ? "Stop Sharing" : "Share Screen"}
                      active={sharingScreen}
                      onClick={startScreenShare}
                    />
                  )}
                  {isHost && (
                    <BottomControl Icon={PencilRuler} label="Tools" active />
                  )}
                  <BottomControl Icon={Presentation} label="Materials" />
                  <BottomControl
                    Icon={Vote}
                    label="Quiz"
                    active={showQuizPanel}
                    onClick={() => setShowQuizPanel((v) => !v)}
                  />
                  <BottomControl Icon={DoorOpen} label="Breakout" />
                  <BottomControl Icon={ThumbsUp} label="Feedback" />
                </div>

                <div className="rounded-2xl bg-red-50 p-1.5">
                  <BottomControl
                    Icon={X}
                    label={
                      ending ? "..." : isHost ? "End Session" : "Leave Session"
                    }
                    danger
                    onClick={handleEndOrLeave}
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
                    {/* You */}
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
                            {isHost ? (
                              "Host"
                            ) : (
                              <>
                                <Dot className="text-emerald-500" size={14} />
                                Online (You)
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isHost && (
                          <span className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white">
                            Manage
                          </span>
                        )}
                        {micEnabled ? (
                          <Mic size={16} className="text-slate-400" />
                        ) : (
                          <MicOff size={16} className="text-red-400" />
                        )}
                        {/* Students never have a camera in this session
                            model, so there's nothing meaningful to show
                            here for their own row. */}
                        {isHost &&
                          (cameraEnabled ? (
                            <Video size={16} className="text-slate-400" />
                          ) : (
                            <VideoOff size={16} className="text-red-400" />
                          ))}
                      </div>
                    </div>

                    {participants.length === 0 && (
                      <p className="text-xs text-slate-400">
                        Waiting for others to join this session...
                      </p>
                    )}

                    {participants.map((p) => {
                      const isRowHost = p.user?.role === "teacher";
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
                                {isRowHost ? (
                                  "Host"
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
                            {isHost && !isRowHost && (
                              <>
                                {/* Bug #5: was a non-functional <span> stub —
                                    now emits mute-student and disables itself
                                    once muted, so the teacher can't send
                                    duplicate requests indefinitely. */}
                                <button
                                  onClick={() => handleMuteStudent(p.socketId)}
                                  disabled={mutedParticipants.has(p.socketId)}
                                  className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {mutedParticipants.has(p.socketId)
                                    ? "Muted"
                                    : "Mute"}
                                </button>
                                {/* Bug #6: kick-student control, previously
                                    entirely missing. */}
                                <button
                                  onClick={() => handleKickStudent(p.socketId)}
                                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-200"
                                >
                                  Remove
                                </button>
                              </>
                            )}
                            {mutedParticipants.has(p.socketId) ? (
                              <MicOff size={16} className="text-red-400" />
                            ) : (
                              <Mic size={16} className="text-slate-400" />
                            )}
                            {/* Students never send video in this session —
                                only the host's own row (rendered above this
                                map) has a real camera. */}
                            {isRowHost && (
                              <Video size={16} className="text-slate-400" />
                            )}
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
                      placeholder="Active message..."
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

            {isHost ? (
              /* Host view: self box + a small tile grid of everyone else.
                 Student tiles will show the avatar fallback since students
                 never send video. */
              <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-sm">
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                  <Camera size={16} />
                  Camera
                </h4>
                <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto">
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

                  {participants.map((p) => (
                    <RemoteVideo
                      key={p.socketId}
                      stream={p.stream}
                      name={p.user?.name}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Student view: no self camera box, no grid of blank student
                 tiles — the main stage is the teacher's feed, since the
                 whiteboard is already the big central element. */
              (() => {
                const teacherParticipant = participants.find(
                  (p) => p.user?.role === "teacher"
                );
                return (
                  <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-sm">
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                      <Camera size={16} />
                      Teacher
                    </h4>
                    <div className="flex-1 overflow-hidden">
                      {teacherParticipant ? (
                        <RemoteVideo
                          stream={teacherParticipant.stream}
                          name={teacherParticipant.user?.name}
                          large
                        />
                      ) : (
                        <div className="flex h-full min-h-[9rem] items-center justify-center rounded-xl bg-slate-800 text-xs text-slate-400">
                          Waiting for the host to join...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}
