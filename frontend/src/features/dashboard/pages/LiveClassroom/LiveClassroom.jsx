import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import {
  GraduationCap,
  Circle,
  Clock,
  BarChart3,
  Dot,
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
  Camera,
  ScreenShare,
  PencilRuler,
  Presentation,
  Vote,
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
  ChevronDown,
  SlidersHorizontal,
  Layers,
  GripVertical,
  Download,
  BadgeQuestionMark,
  Hand,
  Turtle,
  CalendarCheck,
  LayoutDashboard,
  ClipboardCheck,
  ChartColumn,
  LogOut,
  UserX,
  CameraOff,
  Volume2,
  VolumeOff,
  AlertTriangle,
} from "lucide-react";

import { getSession, endSession } from "../../../auth/api/session.api";
import { getChatHistory } from "../../../classroom/api/chat.api";
import TeacherQuizPanel from "../../../classroom/components/QuizPanel/TeacherQuizPanel";
import StudentQuizPanel from "../../../classroom/components/QuizPanel/StudentQuizPanel";
import LiveAttendancePanel from "../../../classroom/components/AttendancePanel/LiveAttendancePanel";
import { getWhiteboard } from "../../../classroom/api/whiteboard.api";
import usePageMeta from "../../../../hooks/usePageMeta";
import useAuth from "../../../auth/hooks/useAuth";

const drawElement = (ctx, el) => {
  if (!el) return;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
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

    ...(import.meta.env.VITE_TURN_URL
      ? [
          {
            urls: import.meta.env.VITE_TURN_URL,
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
        ]
      : []),
  ],
};

const BOARD_WIDTH = 1600;
const BOARD_HEIGHT = 900;

const REACTIONS = [
  { id: "got-it", Icon: ThumbsUp, label: "Got it" },
  { id: "confused", Icon: BadgeQuestionMark, label: "Confused" },
  { id: "raise-hand", Icon: Hand, label: "Raise hand" },
  { id: "slow-down", Icon: Turtle, label: "Slow down" },
];

const NAV_RAIL_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Classrooms", path: "/classrooms" },
  { icon: CalendarCheck, label: "Attendance", path: "/attendance" },
  { icon: ClipboardCheck, label: "Quizzes", path: "/quizzes" },
  { icon: Video, label: "Recordings", path: "/recordings" },
  { icon: ChartColumn, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const navRailIconClass = (active) =>
  `flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
    active
      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/30"
      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
  }`;

const NavRailIcon = ({ Icon, active, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    data-tooltip={label}
    title={label}
    className={navRailIconClass(active)}
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
  iconClassName,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    data-tooltip={title}
    title={title}
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
      active ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    {colorDot ? (
      <span
        className="h-4 w-4 rounded-full border border-black/10"
        style={{ backgroundColor: colorDot }}
      />
    ) : (
      <Icon size={16} className={iconClassName} />
    )}
  </button>
);

const BottomControl = ({
  Icon,
  label,
  active,
  danger,
  disabled,
  onClick,
}) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    data-tooltip={label}
    title={label}
    className={`flex h-14 w-0 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-1.5 text-sm font-medium transition-colors ${
      disabled
        ? "cursor-not-allowed opacity-60 text-slate-400"
        : danger
          ? "text-red-500"
          : active
            ? "bg-indigo-50 text-indigo-600"
            : "text-slate-600 hover:bg-slate-100"
    }`}
  >
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
        disabled
          ? "bg-slate-100 text-slate-400"
          : danger
            ? "bg-red-100 text-red-500"
            : active
              ? "bg-indigo-100 text-indigo-600"
              : "bg-slate-100 text-slate-600"
      }`}
    >
      <Icon size={19} />
    </span>
    <span className="truncate">{label}</span>
  </button>
);

const ParticipantThumb = ({ stream, active, name }) => {
  const videoRef = useRef(null);
  const showVideo = active && !!stream && stream.getVideoTracks().length > 0;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-800">
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${showVideo ? "" : "opacity-0"}`}
        />
      )}
      {!showVideo && (
        <img
          src={avatarFor(name)}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
};

const AudioRelay = ({ stream, onAutoplayBlocked }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    // Browser autoplay policies can silently block unmuted playback; if so,
    // register the element so we can retry once the user interacts with the page.
    const playPromise = el.play();
    if (playPromise?.catch) {
      playPromise.catch(() => onAutoplayBlocked?.(el));
    }
  }, [stream, onAutoplayBlocked]);

  if (!stream) return null;
  return <video ref={videoRef} autoPlay playsInline className="hidden" />;
};

const TeacherCameraTile = ({ stream, active, name }) => {
  const videoRef = useRef(null);
  const showVideo = active && !!stream && stream.getVideoTracks().length > 0;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative h-full min-h-[9rem] overflow-hidden rounded-xl bg-black shadow-sm">
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${
            showVideo ? "" : "opacity-0"
          }`}
        />
      )}
      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <img
            src={avatarFor(name)}
            alt={name}
            className="h-16 w-16 rounded-full object-cover"
          />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 truncate bg-slate-900/80 p-1 text-[10px] text-white">
        {name || "Teacher"}
      </div>
    </div>
  );
};

const ScreenShareStage = ({ stream }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="h-full w-full object-contain"
    />
  );
};

const StudentZoomModal = ({ participant, hostScreenStreamId, onClose }) => {
  const videoRef = useRef(null);
  const stream = participant
    ? Object.values(participant.videoStreams || {}).find(
        (s) => s.id !== hostScreenStreamId
      ) || null
    : null;
  const showVideo =
    !!participant?.cameraEnabled &&
    !!stream &&
    stream.getVideoTracks().length > 0;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!participant) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">
              {participant.user?.name || "Student"}
            </p>
            <p className="text-xs text-slate-400">Zoomed camera view</p>
          </div>
          <button
            onClick={onClose}
            data-tooltip="Close View"
            title="Close"
            className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative aspect-video w-full bg-black">
          {showVideo && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-contain"
            />
          )}
          {!showVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-800">
              <img
                src={avatarFor(participant.user?.name)}
                alt={participant.user?.name}
                className="h-20 w-20 rounded-full object-cover"
              />
              <p className="text-xs text-slate-400">Camera is off</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function LiveClassroom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const currentUser = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const [rightTab, setRightTab] = useState("participants");
  const [showQuizPanel, setShowQuizPanel] = useState(false);
  const [showAttendancePanel, setShowAttendancePanel] = useState(false);

  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnections = useRef({});
  const pendingCandidates = useRef({});
  const localStream = useRef(null);
  const screenStream = useRef(null);
  const togglingCameraRef = useRef(false);
  const togglingMicRef = useRef(false);
  const cameraSenders = useRef({});
  const screenSenders = useRef({});
  const politeRef = useRef({});
  const makingOfferRef = useRef({});
  const blockedAudioElsRef = useRef(new Set());
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const [session, setSession] = useState(null);
  usePageMeta(session?.title || "Live Class");
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);

  const [connected, setConnected] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [mediaError, setMediaError] = useState("");

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [hostSharingScreen, setHostSharingScreen] = useState(false);
  const [hostScreenStreamId, setHostScreenStreamId] = useState(null);
  const [localScreenPreview, setLocalScreenPreview] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);

  const [cameraDevices, setCameraDevices] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const whiteboardSectionRef = useRef(null);
  const ctxRef = useRef(null);
  const boardScaleRef = useRef({ x: 1, y: 1 });
  const colorInputRef = useRef(null);
  const boardsRef = useRef({});
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);
  const activePageIdRef = useRef(null);
  const hasRedoRef = useRef({});
  const drawStateRef = useRef({ isDrawing: false, current: null });
  const remoteLiveRef = useRef({});
  const [showDrawTools, setShowDrawTools] = useState(true);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#1e293b");
  const [penSize, setPenSize] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [historyTick, setHistoryTick] = useState(0);
  const bumpHistory = useCallback(() => setHistoryTick((t) => t + 1), []);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    setCanUndo((boardsRef.current[activePageId]?.length || 0) > 0);
    setCanRedo(!!hasRedoRef.current[activePageId]);
  }, [historyTick, activePageId]);

  const [allowStudentDraw, setAllowStudentDraw] = useState(false);
  const [wbZoom, setWbZoom] = useState(1);
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [wbError, setWbError] = useState("");
  const [downloadingBoards, setDownloadingBoards] = useState(false);
  const [openPanel, setOpenPanel] = useState(null);

  const [showMaterials, setShowMaterials] = useState(false);
  const [materialsPageId, setMaterialsPageId] = useState(null);
  const materialsCanvasRef = useRef(null);
  const materialsCanvasWrapRef = useRef(null);

  const [showFeedbackMenu, setShowFeedbackMenu] = useState(false);
  const [reactionToasts, setReactionToasts] = useState([]);

  const [removedNotice, setRemovedNotice] = useState("");
  const [forceMuted, setForceMuted] = useState(false);
  const [mutedParticipants, setMutedParticipants] = useState(() => new Set());

  const [zoomedStudentId, setZoomedStudentId] = useState(null);
  const lastTapRef = useRef({ socketId: null, time: 0 });

  const isHost =
    !!session &&
    !!currentUser &&
    (session.createdBy?._id === currentUser.id ||
      session.createdBy === currentUser.id);

  const isHostRef = useRef(false);
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  const canDraw = isHost || allowStudentDraw;

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

  useEffect(() => {
    if (!sessionId) return;

    getChatHistory(sessionId)
      .then((history) => setMessages(history))
      .catch((err) => console.log("Chat history error:", err));
  }, [sessionId]);

  useEffect(() => {
    if (!session?.startTime) return;

    const start = new Date(session.startTime).getTime();
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.startTime]);

  useEffect(() => {
    if (sessionLoading) return;

    let cancelled = false;

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) videoTrack.enabled = false;
        if (audioTrack) audioTrack.enabled = false;

        localStream.current = stream;

        setCameraEnabled(false);
        setMicEnabled(false);
        setMediaError("");

        setActiveCameraId(videoTrack?.getSettings().deviceId || null);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("[Media] Initial media error:", err);

        if (!cancelled) {
          setCameraEnabled(false);
          setMicEnabled(false);
          setMediaError("Camera or microphone unavailable.");
        }
      } finally {
        if (!cancelled) {
          setMediaReady(true);
        }
      }
    };

    initMedia();

    return () => {
      cancelled = true;
    };
  }, [sessionLoading]);

  useEffect(() => {
    if (!mediaReady || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        setCameraDevices(devices.filter((d) => d.kind === "videoinput"));
      })
      .catch((err) => console.log(err));
  }, [mediaReady]);

  const createPeerConnection = useCallback(
    (targetId) => {
      // Close old connection if it exists
      if (peerConnections.current[targetId]) {
        try {
          peerConnections.current[targetId].close();
        } catch (err) {
          console.error("[WebRTC] Error closing old PC:", err);
        }
      }

      const pc = new RTCPeerConnection(rtcConfig);

      peerConnections.current[targetId] = pc;

      politeRef.current[targetId] = (socketRef.current?.id || "") < targetId;

      makingOfferRef.current[targetId] = false;

      // --------------------------------------------------
      // ADD LOCAL AUDIO + CAMERA AT CONNECTION CREATION
      // --------------------------------------------------

      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => {
          try {
            const sender = pc.addTrack(track, localStream.current);

            if (track.kind === "video") {
              cameraSenders.current[targetId] = sender;
            }
          } catch (err) {
            console.error(
              `[WebRTC][${targetId}] Failed to add ${track.kind} track:`,
              err
            );
          }
        });
      }

      // --------------------------------------------------
      // SCREEN SHARE
      // --------------------------------------------------

      if (isHostRef.current) {
        const screenTrack = screenStream.current?.getVideoTracks()[0];

        if (screenTrack) {
          try {
            screenSenders.current[targetId] = pc.addTrack(
              screenTrack,
              screenStream.current
            );
          } catch (err) {
            console.error(
              `[WebRTC][${targetId}] Failed to add screen track:`,
              err
            );
          }
        }
      }

      // --------------------------------------------------
      // ICE CANDIDATES
      // --------------------------------------------------

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;

        socketRef.current?.emit("ice-candidate", {
          roomId: sessionId,
          target: targetId,
          candidate: event.candidate,
        });
      };

      // --------------------------------------------------
      // REMOTE TRACK
      // --------------------------------------------------

      pc.ontrack = (event) => {
        console.log(`[WebRTC][${targetId}] Remote track received:`, {
          kind: event.track.kind,
          id: event.track.id,
          enabled: event.track.enabled,
          readyState: event.track.readyState,
          streams: event.streams?.length,
        });

        // Important: if the browser doesn't provide event.streams[0],
        // build our own MediaStream so the track isn't lost.
        const stream = event.streams?.[0] || new MediaStream([event.track]);

        setParticipants((prev) =>
          prev.map((participant) => {
            if (participant.socketId !== targetId) {
              return participant;
            }

            return {
              ...participant,
              videoStreams: {
                ...(participant.videoStreams || {}),
                [stream.id]: stream,
              },
            };
          })
        );
      };

      // --------------------------------------------------
      // NEGOTIATION
      // --------------------------------------------------

      pc.onnegotiationneeded = async () => {
        try {
          if (pc.signalingState !== "stable") {
            return;
          }

          if (makingOfferRef.current[targetId]) {
            return;
          }

          makingOfferRef.current[targetId] = true;

          const offer = await pc.createOffer();

          if (pc.signalingState !== "stable") {
            return;
          }

          await pc.setLocalDescription(offer);

          socketRef.current?.emit("offer", {
            roomId: sessionId,
            target: targetId,
            offer: pc.localDescription,
          });
        } catch (err) {
          console.error(`[WebRTC][${targetId}] Negotiation error:`, err);
        } finally {
          makingOfferRef.current[targetId] = false;
        }
      };

      // --------------------------------------------------
      // ICE STATE
      // --------------------------------------------------

      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC][${targetId}] ICE state:`, pc.iceConnectionState);

        if (pc.iceConnectionState === "failed") {
          console.warn(`[WebRTC][${targetId}] ICE failed - restarting ICE`);

          pc.restartIce?.();
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log(
          `[WebRTC][${targetId}] ICE gathering:`,
          pc.iceGatheringState
        );
      };

      // --------------------------------------------------
      // CONNECTION STATE
      // --------------------------------------------------

      pc.onconnectionstatechange = () => {
        console.log(
          `[WebRTC][${targetId}] Connection state:`,
          pc.connectionState
        );

        if (pc.connectionState === "connected") {
          console.log(`[WebRTC][${targetId}] Senders:`, pc.getSenders());
          console.log(`[WebRTC][${targetId}] Receivers:`, pc.getReceivers());
          console.log(
            `[WebRTC][${targetId}] Transceivers:`,
            pc.getTransceivers()
          );
        }

        if (pc.connectionState === "failed") {
          pc.restartIce?.();
        }
      };

      // --------------------------------------------------
      // SIGNALING STATE
      // --------------------------------------------------

      pc.onsignalingstatechange = () => {
        console.log(
          `[WebRTC][${targetId}] Signaling state:`,
          pc.signalingState
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

  const redrawCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    const elements = boardsRef.current[activePageIdRef.current] || [];
    elements.forEach((el) => drawElement(ctx, el));
    Object.values(remoteLiveRef.current).forEach((el) => drawElement(ctx, el));
  }, []);

  const applyBoardPages = useCallback((incomingPages, serverActivePageId) => {
    const list = Array.isArray(incomingPages) ? incomingPages : [];
    list.forEach((p) => {
      boardsRef.current[p.pageId] = Array.isArray(p.elements) ? p.elements : [];
    });
    setPages(list.map((p) => ({ pageId: p.pageId, name: p.name })));
    hasRedoRef.current = {};
    setActivePageId(serverActivePageId || list[0]?.pageId || null);
  }, []);

  useEffect(() => {
    activePageIdRef.current = activePageId;
    if (activePageId) redrawCanvas();
  }, [activePageId, redrawCanvas]);

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

      const scaleX = width / BOARD_WIDTH;
      const scaleY = height / BOARD_HEIGHT;
      boardScaleRef.current = { x: scaleX, y: scaleY };

      const ctx = canvas.getContext("2d");
      ctx.setTransform(ratio * scaleX, 0, 0, ratio * scaleY, 0, 0);
      ctxRef.current = ctx;
      redrawCanvas();
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [redrawCanvas, sessionLoading]);

  useEffect(() => {
    if (!showMaterials || !materialsPageId) return;
    const canvas = materialsCanvasRef.current;
    const wrap = materialsCanvasWrapRef.current;
    if (!canvas || !wrap) return;

    const { width: availWidth, height: availHeight } =
      wrap.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    const scale = Math.min(
      availWidth / BOARD_WIDTH,
      availHeight / BOARD_HEIGHT
    );
    const cssWidth = BOARD_WIDTH * scale;
    const cssHeight = BOARD_HEIGHT * scale;

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = cssWidth * ratio;
    canvas.height = cssHeight * ratio;

    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    ctx.scale(scale, scale);

    const elements = boardsRef.current[materialsPageId] || [];
    elements.forEach((el) => drawElement(ctx, el));
  }, [showMaterials, materialsPageId]);

  useEffect(() => {
    if (!sessionId) return;

    getWhiteboard(sessionId)
      .then(({ pages: loadedPages, activePageId: loadedActivePageId }) => {
        applyBoardPages(loadedPages, loadedActivePageId);
        if (ctxRef.current) redrawCanvas();
        bumpHistory();
      })
      .catch((err) => console.log("Whiteboard history error:", err));
  }, [sessionId, applyBoardPages, redrawCanvas, bumpHistory]);

  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const { x: scaleX, y: scaleY } = boardScaleRef.current;
    return [
      (clientX - rect.left) / wbZoom / scaleX,
      (clientY - rect.top) / wbZoom / scaleY,
    ];
  };

  const commitElement = useCallback(
    (el) => {
      if (!canDraw || !activePageId) return;

      try {
        const pageElements =
          boardsRef.current[activePageId] ||
          (boardsRef.current[activePageId] = []);
        pageElements.push(el);
        hasRedoRef.current[activePageId] = false;
        redrawCanvas();
        bumpHistory();
        socketRef.current?.emit("draw", {
          roomId: sessionId,
          pageId: activePageId,
          element: el,
        });
      } catch (err) {
        console.error("Whiteboard draw error:", err);
        setWbError("Couldn't send that drawing action. Retrying...");
      }
    },
    [canDraw, activePageId, sessionId, redrawCanvas, bumpHistory]
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
        type: tool,
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

    socketRef.current?.emit("draw-preview", {
      roomId: sessionId,
      pageId: activePageId,
      element: current,
    });
  };

  const handlePointerUp = () => {
    if (!canDraw) return;
    const current = drawStateRef.current.current;
    drawStateRef.current.isDrawing = false;
    drawStateRef.current.current = null;

    if (!current) return;
    if (current.type === "path" && current.points.length < 2) {
      return;
    }
    commitElement(current);
  };

  const handleUndo = () => {
    if (!canDraw || !canUndo || !activePageId) return;
    try {
      socketRef.current?.emit("undo", {
        roomId: sessionId,
        pageId: activePageId,
      });
    } catch (err) {
      console.error("Whiteboard undo error:", err);
    }
  };

  const handleRedo = () => {
    if (!canDraw || !activePageId) return;
    try {
      socketRef.current?.emit("redo", {
        roomId: sessionId,
        pageId: activePageId,
      });
    } catch (err) {
      console.error("Whiteboard redo error:", err);
    }
  };

  const handleClearBoard = () => {
    if (!isHost || !activePageId) return;
    if (!window.confirm("Are you sure you want to clear the whiteboard?")) {
      return;
    }
    try {
      boardsRef.current[activePageId] = [];
      hasRedoRef.current[activePageId] = false;
      redrawCanvas();
      bumpHistory();
      socketRef.current?.emit("clear-board", {
        roomId: sessionId,
        pageId: activePageId,
      });
    } catch (err) {
      console.error("Whiteboard clear error:", err);
    }
  };

  const handleAddPage = () => {
    if (!isHost) return;
    socketRef.current?.emit("add-page", { roomId: sessionId });
  };

  const handleDeletePage = (pageId) => {
    if (!isHost) return;
    if (!window.confirm("Delete this whiteboard page?")) return;
    socketRef.current?.emit("delete-page", { roomId: sessionId, pageId });
  };

  const handleDownloadAllBoards = async () => {
    if (!pages.length || downloadingBoards) return;
    setDownloadingBoards(true);

    try {
      const ratio = window.devicePixelRatio || 1;
      const width = BOARD_WIDTH;
      const height = BOARD_HEIGHT;
      const orientation = width >= height ? "landscape" : "portrait";

      const doc = new jsPDF({
        orientation,
        unit: "px",
        format: [width, height],
      });

      pages.forEach((page, index) => {
        if (index > 0) doc.addPage([width, height], orientation);

        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = width * ratio;
        exportCanvas.height = height * ratio;
        const ctx = exportCanvas.getContext("2d");
        ctx.scale(ratio, ratio);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const elements = boardsRef.current[page.pageId] || [];
        elements.forEach((el) => drawElement(ctx, el));

        doc.addImage(
          exportCanvas.toDataURL("image/png"),
          "PNG",
          0,
          0,
          width,
          height
        );
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text(page.name || `Page ${index + 1}`, 10, height - 10);
      });

      const stamp = new Date().toISOString().slice(0, 10);
      doc.save(`${classroomName || "whiteboard"}-${stamp}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      setWbError("Couldn't generate the PDF. Please try again.");
    } finally {
      setDownloadingBoards(false);
    }
  };

  const switchPage = (pageId) => {
    setActivePageId(pageId);
    if (isHost) {
      socketRef.current?.emit("switch-page", { roomId: sessionId, pageId });
    }
  };

  const dragPageIdRef = useRef(null);
  const [dragOverPageId, setDragOverPageId] = useState(null);

  const handleDragStart = (pageId) => (e) => {
    dragPageIdRef.current = pageId;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (pageId) => (e) => {
    e.preventDefault();
    if (pageId !== dragPageIdRef.current) setDragOverPageId(pageId);
  };

  const handleDragLeave = () => setDragOverPageId(null);

  const handleDragEnd = () => {
    dragPageIdRef.current = null;
    setDragOverPageId(null);
  };

  const handleDrop = (targetPageId) => (e) => {
    e.preventDefault();
    const sourceId = dragPageIdRef.current;
    dragPageIdRef.current = null;
    setDragOverPageId(null);
    if (!sourceId || sourceId === targetPageId) return;

    const fromIdx = pages.findIndex((p) => p.pageId === sourceId);
    const toIdx = pages.findIndex((p) => p.pageId === targetPageId);
    if (fromIdx === -1 || toIdx === -1) return;

    const next = [...pages];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);

    setPages(next);
    socketRef.current?.emit("reorder-pages", {
      roomId: sessionId,
      pageIds: next.map((p) => p.pageId),
    });
  };

  const toggleStudentDraw = () => {
    if (!isHost) return;
    const next = !allowStudentDraw;
    socketRef.current?.emit("set-draw-permission", {
      roomId: sessionId,
      allow: next,
    });
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

  useEffect(() => {
    if (!sessionId) return;

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

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

    const reconcileParticipant = (
      prev,
      {
        socketId,
        user,
        cameraEnabled: theirCameraEnabled,
        micEnabled: theirMicEnabled,
        forceMuted: theirForceMuted,
      }
    ) => {
      const staleIdx = prev.findIndex(
        (p) => p.user?.id === user?.id && p.socketId !== socketId
      );
      if (staleIdx !== -1) {
        const stale = prev[staleIdx];
        peerConnections.current[stale.socketId]?.close();
        delete peerConnections.current[stale.socketId];
        delete pendingCandidates.current[stale.socketId];
        delete cameraSenders.current[stale.socketId];
        delete screenSenders.current[stale.socketId];
        delete politeRef.current[stale.socketId];
        delete makingOfferRef.current[stale.socketId];
        const next = [...prev];
        next[staleIdx] = {
          socketId,
          user,
          videoStreams: {},
          cameraEnabled: !!theirCameraEnabled,
          micEnabled: !!theirMicEnabled,
          forceMuted: !!theirForceMuted,
        };
        return next;
      }
      if (prev.some((p) => p.socketId === socketId)) return prev;
      return [
        ...prev,
        {
          socketId,
          user,
          videoStreams: {},
          cameraEnabled: !!theirCameraEnabled,
          micEnabled: !!theirMicEnabled,
          forceMuted: !!theirForceMuted,
        },
      ];
    };

    socket.on("existing-participants", (existing) => {
      setParticipants((prev) =>
        existing.reduce((acc, p) => reconcileParticipant(acc, p), prev)
      );

      const forceMutedIds = existing
        .filter((p) => p.forceMuted)
        .map((p) => p.socketId);
      if (forceMutedIds.length > 0) {
        setMutedParticipants((prev) => {
          const next = new Set(prev);
          forceMutedIds.forEach((id) => next.add(id));
          return next;
        });
      }

      existing.forEach(({ socketId }) => createPeerConnection(socketId));
    });

    socket.on(
      "user-joined",
      ({ socketId, user, cameraEnabled, micEnabled, forceMuted }) => {
        setParticipants((prev) =>
          reconcileParticipant(prev, {
            socketId,
            user,
            cameraEnabled,
            micEnabled,
            forceMuted,
          })
        );
      }
    );

    socket.on("offer", async ({ sender, offer }) => {
      const pc =
        peerConnections.current[sender] || createPeerConnection(sender);

      if (!pc) return;

      const polite = politeRef.current[sender];

      const offerCollision =
        offer.type === "offer" &&
        (makingOfferRef.current[sender] || pc.signalingState !== "stable");

      if (!polite && offerCollision) {
        console.log(`[WebRTC][${sender}] Ignoring offer collision`);
        return;
      }

      try {
        if (offerCollision) {
          await pc.setLocalDescription({ type: "rollback" });
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        await flushQueuedCandidates(sender, pc);

        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer);

        socketRef.current?.emit("answer", {
          roomId: sessionId,
          target: sender,
          answer: pc.localDescription,
        });
      } catch (err) {
        console.error(`[WebRTC][${sender}] Offer handling failed:`, err);
      }
    });

    socket.on("answer", async ({ sender, answer }) => {
      const pc = peerConnections.current[sender];

      if (!pc) return;

      if (pc.signalingState !== "have-local-offer") {
        console.warn(
          `[WebRTC][${sender}] Ignoring answer in state:`,
          pc.signalingState
        );
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        await flushQueuedCandidates(sender, pc);
      } catch (err) {
        console.error(`[WebRTC][${sender}] Answer handling failed:`, err);
      }
    });

    socket.on("ice-candidate", async ({ sender, candidate }) => {
      const pc = peerConnections.current[sender];

      if (!pc || !candidate) return;

      if (!pc.remoteDescription) {
        pendingCandidates.current[sender] =
          pendingCandidates.current[sender] || [];

        pendingCandidates.current[sender].push(candidate);

        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error(`[WebRTC][${sender}] ICE candidate failed:`, err);
      }
    });

    socket.on("user-left", ({ socketId }) => {
      peerConnections.current[socketId]?.close();
      delete peerConnections.current[socketId];
      delete pendingCandidates.current[socketId];
      delete cameraSenders.current[socketId];
      delete screenSenders.current[socketId];
      delete politeRef.current[socketId];
      delete makingOfferRef.current[socketId];
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      setMutedParticipants((prev) => {
        if (!prev.has(socketId)) return prev;
        const next = new Set(prev);
        next.delete(socketId);
        return next;
      });
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("receive-reaction", ({ reactionId, from }) => {
      if (!REACTIONS.some((r) => r.id === reactionId)) return;
      const toastId = `${Date.now()}-${Math.random()}`;
      setReactionToasts((prev) => [...prev, { id: toastId, reactionId, from }]);
      setTimeout(() => {
        setReactionToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 4000);
    });

    socket.on("user-typing", () => setPeerTyping(true));
    socket.on("user-stop-typing", () => setPeerTyping(false));

    socket.on("draw", ({ pageId, element }) => {
      if (!element || !pageId) return;
      if (
        element.id &&
        socketRef.current &&
        element.id.startsWith(`${socketRef.current.id}-`)
      ) {
        return;
      }

      try {
        if (element.id) delete remoteLiveRef.current[element.id];
        const pageElements =
          boardsRef.current[pageId] || (boardsRef.current[pageId] = []);
        pageElements.push(element);
        if (pageId === activePageIdRef.current) {
          redrawCanvas();
          bumpHistory();
        }
      } catch (err) {
        console.error("Whiteboard render error:", err);
        setWbError("Had trouble rendering the last whiteboard update.");
      }
    });

    socket.on("draw-preview", ({ pageId, element }) => {
      if (!element?.id || pageId !== activePageIdRef.current) return;
      if (
        socketRef.current &&
        element.id.startsWith(`${socketRef.current.id}-`)
      )
        return;
      remoteLiveRef.current[element.id] = element;
      redrawCanvas();
    });

    socket.on("page-sync", ({ pageId, elements }) => {
      if (!pageId) return;
      boardsRef.current[pageId] = Array.isArray(elements) ? elements : [];
      hasRedoRef.current[pageId] = true;
      if (pageId === activePageIdRef.current) {
        remoteLiveRef.current = {};
        redrawCanvas();
        bumpHistory();
      }
    });

    socket.on("page-added", ({ pageId, name, elements }) => {
      if (!pageId) return;
      boardsRef.current[pageId] = Array.isArray(elements) ? elements : [];
      setPages((prev) => [...prev, { pageId, name }]);
      setActivePageId(pageId);
    });

    socket.on("page-deleted", ({ pageId }) => {
      if (!pageId) return;
      delete boardsRef.current[pageId];
      delete hasRedoRef.current[pageId];
      setPages((prev) => {
        const next = prev.filter((p) => p.pageId !== pageId);
        if (activePageIdRef.current === pageId) {
          setActivePageId(next[0]?.pageId || null);
        }
        return next;
      });
    });

    socket.on("active-page-changed", ({ pageId }) => {
      if (pageId) setActivePageId(pageId);
    });

    socket.on("pages-reordered", ({ pageIds }) => {
      if (!Array.isArray(pageIds)) return;
      setPages((prev) => {
        const byId = new Map(prev.map((p) => [p.pageId, p]));
        const next = pageIds.map((id) => byId.get(id)).filter(Boolean);
        prev.forEach((p) => {
          if (!next.includes(p)) next.push(p);
        });
        return next;
      });
    });

    socket.on(
      "board-sync",
      ({
        pages: syncedPages,
        activePageId: syncedActivePageId,
        allowStudentDraw: allow,
      }) => {
        applyBoardPages(syncedPages, syncedActivePageId);
        remoteLiveRef.current = {};
        if (typeof allow === "boolean") setAllowStudentDraw(allow);
        redrawCanvas();
        bumpHistory();
        setWbError("");
      }
    );

    socket.on("draw-permission-changed", ({ allowStudentDraw: allow }) => {
      setAllowStudentDraw(!!allow);
    });

    socket.on("screen-share-status", ({ sharing, streamId }) => {
      setHostSharingScreen(!!sharing);
      setHostScreenStreamId(sharing ? streamId || null : null);
    });

    socket.on("camera-status", ({ sender, enabled }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === sender ? { ...p, cameraEnabled: !!enabled } : p
        )
      );
    });

    socket.on("mic-status", ({ sender, enabled }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === sender ? { ...p, micEnabled: !!enabled } : p
        )
      );
    });

    socket.on("force-camera-off", () => {
      const track = localStream.current?.getVideoTracks()[0];
      if (track) track.enabled = false;
      setCameraEnabled(false);
    });

    socket.on("force-mute", () => {
      const track = localStream.current?.getAudioTracks()[0];
      if (track) track.enabled = false;
      setMicEnabled(false);
      setForceMuted(true);
    });

    socket.on("force-unmute", async () => {
      setForceMuted(false);
      const track = localStream.current?.getAudioTracks()[0];
      if (track) {
        track.enabled = true;
        setMicEnabled(true);
        socketRef.current?.emit("mic-status", {
          roomId: sessionId,
          enabled: true,
        });
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            if (!localStream.current) {
              localStream.current = new MediaStream();
            }
            localStream.current.addTrack(audioTrack);
            Object.values(peerConnections.current).forEach((pc) => {
              const alreadyExists = pc
                .getSenders()
                .some((sender) => sender.track && sender.track.kind === "audio");
              if (!alreadyExists) {
                pc.addTrack(audioTrack, localStream.current);
              }
            });
            audioTrack.enabled = true;
            setMicEnabled(true);
            socketRef.current?.emit("mic-status", {
              roomId: sessionId,
              enabled: true,
            });
          }
        } catch (err) {
          console.warn("[Microphone] Could not auto-acquire on unmute:", err);
        }
      }
    });

    socket.on("student-muted", ({ socketId }) => {
      setMutedParticipants((prev) => new Set(prev).add(socketId));
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === socketId
            ? { ...p, micEnabled: false, forceMuted: true }
            : p
        )
      );
    });

    socket.on("student-unmuted", ({ socketId }) => {
      setMutedParticipants((prev) => {
        const next = new Set(prev);
        next.delete(socketId);
        return next;
      });
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === socketId
            ? { ...p, micEnabled: true, forceMuted: false }
            : p
        )
      );
    });

    socket.on("removed-from-session", ({ message }) => {
      setRemovedNotice(
        message || "You have been removed from this session by the host."
      );
    });

    socket.on("session-error", ({ message }) => {
      setRemovedNotice(message || "Unable to join this session.");
    });

    socket.on("session-ended", ({ message }) => {
      setRemovedNotice(message || "This session has ended.");
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
  }, [
    sessionId,
    token,
    createPeerConnection,
    redrawCanvas,
    bumpHistory,
    applyBoardPages,
  ]);

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
    socketRef.current.emit("request-board-sync", { roomId: sessionId });
  }, [connected, mediaReady, sessionId, currentUser]);

  useEffect(() => {
    return () => {
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      cameraSenders.current = {};
      screenSenders.current = {};
      localStream.current?.getTracks().forEach((t) => t.stop());
      screenStream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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

  const handleAutoplayBlocked = useCallback((el) => {
    blockedAudioElsRef.current.add(el);
    setNeedsAudioUnlock(true);
  }, []);

  useEffect(() => {
    if (!needsAudioUnlock) return;

    const unlock = () => {
      blockedAudioElsRef.current.forEach((el) => {
        el.play().catch(() => {});
      });
      blockedAudioElsRef.current.clear();
      setNeedsAudioUnlock(false);
    };

    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [needsAudioUnlock]);

  const pushCameraTrack = (track) => {
    if (!track) return;

    Object.entries(peerConnections.current).forEach(([targetId, pc]) => {
      const sender = cameraSenders.current[targetId];

      if (sender) {
        sender.replaceTrack(track).catch((err) => {
          console.error(
            `[WebRTC][${targetId}] Camera replaceTrack failed:`,
            err
          );
        });
      } else {
        try {
          const newSender = pc.addTrack(track, localStream.current);

          cameraSenders.current[targetId] = newSender;
        } catch (err) {
          console.error(`[WebRTC][${targetId}] Camera addTrack failed:`, err);
        }
      }
    });
  };

  const pushScreenTrack = (track) => {
    if (!track) return;

    Object.entries(peerConnections.current).forEach(([targetId, pc]) => {
      const sender = screenSenders.current[targetId];

      if (sender) {
        sender.replaceTrack(track).catch((err) => {
          console.error(
            `[WebRTC][${targetId}] Screen replaceTrack failed:`,
            err
          );
        });
      } else {
        try {
          screenSenders.current[targetId] = pc.addTrack(
            track,
            screenStream.current
          );
        } catch (err) {
          console.error(`[WebRTC][${targetId}] Screen addTrack failed:`, err);
        }
      }
    });
  };

  const removeScreenTrack = () => {
    Object.entries(peerConnections.current).forEach(([targetId, pc]) => {
      const sender = screenSenders.current[targetId];
      if (!sender) return;
      try {
        pc.removeTrack(sender);
      } catch (err) {
        console.log(err);
      }
      delete screenSenders.current[targetId];
    });
  };

  const toggleCamera = async () => {
    const existingTrack = localStream.current?.getVideoTracks()[0];

    // Camera already exists → simply enable/disable it.
    if (existingTrack) {
      existingTrack.enabled = !existingTrack.enabled;

      setCameraEnabled(existingTrack.enabled);

      socketRef.current?.emit("camera-status", {
        roomId: sessionId,
        enabled: existingTrack.enabled,
      });

      return;
    }

    if (togglingCameraRef.current) {
      return;
    }

    togglingCameraRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      const videoTrack = stream.getVideoTracks()[0];

      if (!videoTrack) {
        throw new Error("No video track returned");
      }

      // Add video track to our local MediaStream
      if (!localStream.current) {
        localStream.current = new MediaStream();
      }

      localStream.current.addTrack(videoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }

      setActiveCameraId(videoTrack.getSettings().deviceId || null);

      pushCameraTrack(videoTrack);

      videoTrack.enabled = true;

      setCameraEnabled(true);
      setMediaError("");

      socketRef.current?.emit("camera-status", {
        roomId: sessionId,
        enabled: true,
      });
    } catch (err) {
      console.error("[Camera] Error:", err);

      setCameraEnabled(false);
      setMediaError("Camera unavailable.");
    } finally {
      togglingCameraRef.current = false;
    }
  };

  const toggleMic = async () => {
    if (!isHost && forceMuted && !micEnabled) {
      setMediaError("You have been muted by the host and cannot unmute yourself.");
      return;
    }

    const existingTrack = localStream.current?.getAudioTracks()[0];

    if (existingTrack) {
      existingTrack.enabled = !existingTrack.enabled;

      setMicEnabled(existingTrack.enabled);

      socketRef.current?.emit("mic-status", {
        roomId: sessionId,
        enabled: existingTrack.enabled,
      });

      return;
    }

    if (togglingMicRef.current) {
      return;
    }

    togglingMicRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const audioTrack = stream.getAudioTracks()[0];

      if (!audioTrack) {
        throw new Error("No audio track returned");
      }

      if (!localStream.current) {
        localStream.current = new MediaStream();
      }

      localStream.current.addTrack(audioTrack);

      Object.values(peerConnections.current).forEach((pc) => {
        const alreadyExists = pc
          .getSenders()
          .some((sender) => sender.track && sender.track.kind === "audio");

        if (!alreadyExists) {
          pc.addTrack(audioTrack, localStream.current);
        }
      });

      audioTrack.enabled = true;

      setMicEnabled(true);
      setMediaError("");

      socketRef.current?.emit("mic-status", {
        roomId: sessionId,
        enabled: true,
      });
    } catch (err) {
      console.error("[Microphone] Error:", err);

      setMicEnabled(false);
      setMediaError("Microphone unavailable.");
    } finally {
      togglingMicRef.current = false;
    }
  };

  const switchCamera = async (deviceId) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });

      const newTrack = newStream.getVideoTracks()[0];

      if (!newTrack) {
        throw new Error("No camera track found");
      }

      const oldTrack = localStream.current?.getVideoTracks()[0];

      if (oldTrack) {
        localStream.current.removeTrack(oldTrack);
        oldTrack.stop();
      }

      if (!localStream.current) {
        localStream.current = new MediaStream();
      }

      localStream.current.addTrack(newTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }

      // IMPORTANT: replace the sender instead of adding another video track.
      pushCameraTrack(newTrack);

      newTrack.enabled = true;

      setActiveCameraId(newTrack.getSettings().deviceId || deviceId);

      setCameraEnabled(true);
      setShowCameraMenu(false);
      setMediaError("");
    } catch (err) {
      console.error("[Camera Switch] Error:", err);
      setMediaError("Unable to switch camera.");
    }
  };

  const retryCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      localStream.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      setCameraEnabled(!!videoTrack);
      setMicEnabled(!!audioTrack);

      setActiveCameraId(videoTrack?.getSettings().deviceId || null);

      setMediaError("");

      // Update existing peer connections
      Object.entries(peerConnections.current).forEach(([targetId, pc]) => {
        if (videoTrack) {
          const videoSender = cameraSenders.current[targetId];

          if (videoSender) {
            videoSender.replaceTrack(videoTrack);
          } else {
            cameraSenders.current[targetId] = pc.addTrack(
              videoTrack,
              localStream.current
            );
          }
        }

        if (audioTrack) {
          const audioSender = pc
            .getSenders()
            .find((sender) => sender.track?.kind === "audio");

          if (audioSender) {
            audioSender.replaceTrack(audioTrack);
          } else {
            pc.addTrack(audioTrack, localStream.current);
          }
        }
      });
    } catch (err) {
      console.error("[Retry Camera] Error:", err);
      setMediaError("Camera unavailable.");
    }
  };

  const stopScreenShare = useCallback(() => {
    screenStream.current?.getTracks().forEach((t) => t.stop());
    screenStream.current = null;
    setLocalScreenPreview(null);

    removeScreenTrack();

    setSharingScreen(false);
    socketRef.current?.emit("screen-share-status", {
      roomId: sessionId,
      sharing: false,
    });
  }, [sessionId]);

  const startScreenShare = async () => {
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
      setLocalScreenPreview(stream);

      pushScreenTrack(screenTrack);

      setSharingScreen(true);
      socketRef.current?.emit("screen-share-status", {
        roomId: sessionId,
        sharing: true,
        streamId: stream.id,
      });
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

  const handleSendReaction = (reactionId) => {
    if (isHost) return;
    socketRef.current?.emit("send-reaction", { roomId: sessionId, reactionId });
    setShowFeedbackMenu(false);
  };

  const handleMuteStudent = (targetSocketId) => {
    if (!isHost) return;
    socketRef.current?.emit("mute-student", {
      roomId: sessionId,
      targetSocketId,
    });
  };

  const handleUnmuteStudent = (targetSocketId) => {
    if (!isHost) return;
    socketRef.current?.emit("unmute-student", {
      roomId: sessionId,
      targetSocketId,
    });
  };

  const handleForceCameraOff = (targetSocketId) => {
    if (!isHost) return;
    socketRef.current?.emit("force-camera-off", {
      roomId: sessionId,
      targetSocketId,
    });
  };

  const handleOpenStudentZoom = (targetSocketId) => {
    if (!isHost) return;
    setZoomedStudentId(targetSocketId);
  };

  const handleRowDoubleClick = (p) => () => {
    if (!isHost || p.user?.role === "teacher") return;
    handleOpenStudentZoom(p.socketId);
  };

  const handleRowTouchEnd = (p) => () => {
    if (!isHost || p.user?.role === "teacher") return;
    const now = Date.now();
    const last = lastTapRef.current;
    if (last.socketId === p.socketId && now - last.time < 300) {
      lastTapRef.current = { socketId: null, time: 0 };
      handleOpenStudentZoom(p.socketId);
    } else {
      lastTapRef.current = { socketId: p.socketId, time: now };
    }
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
    delete cameraSenders.current[targetSocketId];
    delete screenSenders.current[targetSocketId];
    delete politeRef.current[targetSocketId];
    delete makingOfferRef.current[targetSocketId];
    setParticipants((prev) =>
      prev.filter((p) => p.socketId !== targetSocketId)
    );
  };

  const [showHostExitModal, setShowHostExitModal] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (session?.status === "live") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session?.status]);

  const handleEndOrLeave = () => {
    if (isHost) {
      setShowHostExitModal(true);
    } else {
      handleLeaveTemporarily();
    }
  };

  const handleLeaveTemporarily = () => {
    try {
      socketRef.current?.emit("leave-call", { roomId: sessionId });
      socketRef.current?.emit("leave-room", { roomId: sessionId });
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.error("Error leaving room:", err);
    } finally {
      setShowHostExitModal(false);
      navigate(
        session?.classroom?._id
          ? `/classrooms/${session.classroom._id}`
          : "/classrooms"
      );
    }
  };

  const handleEndSessionForAll = async () => {
    try {
      setEnding(true);
      await endSession(sessionId);
    } catch (err) {
      console.error("Failed to end session:", err);
    } finally {
      setEnding(false);
      setShowHostExitModal(false);
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
          data-tooltip="Classrooms"
          title="Back to Classrooms"
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

  const teacherParticipant = participants.find(
    (p) => p.user?.role === "teacher"
  );

  const teacherVideoStreams = Object.values(
    teacherParticipant?.videoStreams || {}
  );
  const teacherScreenStream = hostScreenStreamId
    ? teacherVideoStreams.find((s) => s.id === hostScreenStreamId) || null
    : null;
  const teacherCameraStream =
    teacherVideoStreams.find((s) => s.id !== hostScreenStreamId) || null;

  const zoomedParticipant = zoomedStudentId
    ? participants.find((p) => p.socketId === zoomedStudentId) || null
    : null;

  const isSharingScreenForMe = isHost ? sharingScreen : hostSharingScreen;
  const screenPreviewStream = isHost ? localScreenPreview : teacherScreenStream;

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
      {needsAudioUnlock && (
        <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-center bg-amber-500 py-1.5 text-xs font-medium text-white">
          Your browser blocked audio playback. Click anywhere to enable sound.
        </div>
      )}
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

      {isHost && zoomedParticipant && (
        <StudentZoomModal
          participant={zoomedParticipant}
          hostScreenStreamId={hostScreenStreamId}
          onClose={() => setZoomedStudentId(null)}
        />
      )}

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

        <div className="mt-1 flex flex-wrap items-center justify-between gap-3 pl-9">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
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

          <button
            onClick={handleEndOrLeave}
            disabled={ending}
            data-tooltip={isHost ? "End Session" : "Leave Session"}
            title={isHost ? "End Session" : "Leave Session"}
            className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={14} />
            {ending ? "..." : isHost ? "End Session" : "Leave Session"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="flex w-[72px] flex-col items-center gap-4 bg-slate-900 py-5">
          {NAV_RAIL_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              data-tooltip={item.label}
              title={item.label}
              className={({ isActive }) => navRailIconClass(isActive)}
            >
              <item.icon size={20} />
            </NavLink>
          ))}
          <div className="mt-auto">
            <NavRailIcon
              Icon={LogOut}
              label="Logout"
              onClick={() => {
                signOut();
                navigate("/login", { replace: true });
              }}
            />
          </div>
        </nav>

        <main className="flex flex-1 gap-4 overflow-hidden p-4">
          <div className="flex flex-1 flex-col gap-2 overflow-hidden">
            <section
              ref={whiteboardSectionRef}
              className={`relative flex flex-1 flex-col overflow-hidden bg-white shadow-sm ${
                wbFullscreen ? "" : "rounded-2xl"
              }`}
            >
              {canDraw && showDrawTools && (
                <div className="relative flex flex-wrap items-center justify-between gap-y-1.5 border-b border-slate-100 px-3 py-1.5">
                  {openPanel && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setOpenPanel(null)}
                    />
                  )}

                  <div className="flex flex-wrap items-center gap-0.5">
                    {isHost && pages.length > 0 && (
                      <div className="relative mr-1 border-r border-slate-200 pr-1">
                        <button
                          onClick={() =>
                            setOpenPanel((p) =>
                              p === "pages" ? null : "pages"
                            )
                          }
                          data-tooltip="Manage Pages"
                          title="Pages"
                          className={`flex h-8 items-center gap-1 rounded-md px-1.5 text-xs font-medium transition-colors ${
                            openPanel === "pages"
                              ? "bg-indigo-50 text-indigo-600"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Layers size={15} />
                          <span className="max-w-[72px] truncate">
                            {pages.find((p) => p.pageId === activePageId)
                              ?.name || "Pages"}
                          </span>
                          <ChevronDown size={12} className="text-slate-400" />
                        </button>
                        {openPanel === "pages" && (
                          <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                            <div className="max-h-56 space-y-0.5 overflow-y-auto">
                              {pages.map((p) => (
                                <div
                                  key={p.pageId}
                                  draggable
                                  onDragStart={handleDragStart(p.pageId)}
                                  onDragOver={handleDragOver(p.pageId)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={handleDrop(p.pageId)}
                                  onDragEnd={handleDragEnd}
                                  className={`group flex items-center gap-1 rounded-md transition-shadow ${
                                    dragOverPageId === p.pageId
                                      ? "shadow-[inset_0_0_0_2px_rgba(99,102,241,0.5)]"
                                      : ""
                                  }`}
                                >
                                  <GripVertical
                                    size={13}
                                    className="shrink-0 cursor-grab text-slate-300 active:cursor-grabbing"
                                  />
                                  <button
                                    onClick={() => {
                                      switchPage(p.pageId);
                                      setOpenPanel(null);
                                    }}
                                    data-tooltip={p.name}
                                    title={p.name}
                                    className={`flex-1 truncate rounded-md px-1.5 py-1 text-left text-xs font-medium transition-colors ${
                                      p.pageId === activePageId
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-600 hover:bg-slate-100"
                                    }`}
                                  >
                                    {p.name}
                                  </button>
                                  {pages.length > 1 && (
                                    <button
                                      onClick={() => handleDeletePage(p.pageId)}
                                      data-tooltip="Delete Page"
                                      title="Delete page"
                                      className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 group-hover:flex hover:bg-red-50 hover:text-red-500"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={handleAddPage}
                              data-tooltip="Add Page"
                              title="Add page"
                              className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-slate-200 py-1 text-xs text-slate-500 hover:bg-slate-50"
                            >
                              + Add page
                            </button>
                          </div>
                        )}
                      </div>
                    )}

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

                    <div className="relative ml-1 border-l border-slate-200 pl-1">
                      <button
                        onClick={() =>
                          setOpenPanel((p) => (p === "color" ? null : "color"))
                        }
                        data-tooltip="Stroke Color"
                        title="Color"
                        className="flex h-8 items-center gap-1 rounded-md px-1.5 hover:bg-slate-100"
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-black/10"
                          style={{ backgroundColor: color }}
                        />
                        <ChevronDown size={12} className="text-slate-400" />
                      </button>
                      {openPanel === "color" && (
                        <div className="absolute left-0 top-full z-50 mt-1 flex w-40 flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
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
                              onClick={() => {
                                setColor(hex);
                                setOpenPanel(null);
                              }}
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
                      )}
                    </div>

                    <div className="relative border-l border-slate-200 pl-1">
                      <ToolbarButton
                        Icon={SlidersHorizontal}
                        active={openPanel === "style"}
                        onClick={() =>
                          setOpenPanel((p) => (p === "style" ? null : "style"))
                        }
                        title="Stroke style"
                      />
                      {openPanel === "style" && (
                        <div className="absolute left-0 top-full z-50 mt-1 w-52 space-y-2.5 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                          <div>
                            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-400">
                              <span>Size</span>
                              <span>{penSize}px</span>
                            </div>
                            <div className="mb-1.5 flex items-center gap-1">
                              {[2, 4, 6, 10, 15, 20].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setPenSize(s)}
                                  data-tooltip={`${s}px`}
                                  title={`${s}px`}
                                  className={`flex h-6 flex-1 items-center justify-center rounded text-[10px] font-medium transition-colors ${
                                    penSize === s
                                      ? "bg-indigo-600 text-white"
                                      : "text-slate-500 hover:bg-slate-100"
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={30}
                              value={penSize}
                              onChange={(e) =>
                                setPenSize(Number(e.target.value))
                              }
                              className="h-1 w-full accent-indigo-600"
                            />
                          </div>
                          <div>
                            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-400">
                              <span>Opacity</span>
                              <span>{Math.round(opacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min={0.1}
                              max={1}
                              step={0.05}
                              value={opacity}
                              onChange={(e) =>
                                setOpacity(Number(e.target.value))
                              }
                              className="h-1 w-full accent-indigo-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-1 flex items-center gap-0.5 border-l border-slate-200 pl-1">
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
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {isHost && (
                      <button
                        onClick={toggleStudentDraw}
                        data-tooltip={allowStudentDraw ? "Disable Draw" : "Enable Draw"}
                        title="Allow Students to Draw"
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          allowStudentDraw
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {allowStudentDraw ? (
                          <Unlock size={13} />
                        ) : (
                          <Lock size={13} />
                        )}
                        Students Draw: {allowStudentDraw ? "ON" : "OFF"}
                      </button>
                    )}

                    <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5">
                      <ToolbarButton
                        Icon={ZoomOut}
                        onClick={zoomOut}
                        title="Zoom out"
                      />
                      <button
                        onClick={resetZoom}
                        data-tooltip="Reset Zoom"
                        title="Reset zoom"
                        className="w-9 rounded-md py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100"
                      >
                        {Math.round(wbZoom * 100)}%
                      </button>
                      <ToolbarButton
                        Icon={ZoomIn}
                        onClick={zoomIn}
                        title="Zoom in"
                      />
                    </div>

                    <div className="border-l border-slate-200 pl-1.5">
                      <ToolbarButton
                        Icon={downloadingBoards ? Loader2 : Download}
                        iconClassName={downloadingBoards ? "animate-spin" : ""}
                        onClick={handleDownloadAllBoards}
                        disabled={downloadingBoards || pages.length === 0}
                        title="Download all boards as PDF"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(!connected || wbError) && (
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
                {isHost && showQuizPanel && (
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

                {isHost && showAttendancePanel && (
                  <div className="absolute left-[68%] top-[8%]">
                    <LiveAttendancePanel
                      sessionId={sessionId}
                      onClose={() => setShowAttendancePanel(false)}
                    />
                  </div>
                )}

                {!isHost && (
                  <div className="absolute left-[68%] top-[8%]">
                    <StudentQuizPanel
                      socket={socketRef.current}
                      sessionId={sessionId}
                      studentId={currentUser?.id}
                    />
                  </div>
                )}

                {isSharingScreenForMe && screenPreviewStream && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900">
                    <ScreenShareStage stream={screenPreviewStream} />
                    <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
                      <ScreenShare size={13} />
                      {isHost
                        ? "You are sharing your screen"
                        : `${teacherParticipant?.user?.name || "The host"} is sharing their screen`}
                    </span>
                  </div>
                )}

                {isHost && reactionToasts.length > 0 && (
                  <div className="pointer-events-none absolute bottom-3 right-3 z-30 flex flex-col-reverse gap-2">
                    {reactionToasts.map((t) => {
                      const reaction = REACTIONS.find(
                        (r) => r.id === t.reactionId
                      );
                      if (!reaction) return null;
                      return (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-2 text-sm text-white shadow-lg"
                        >
                          <reaction.Icon size={18} className="shrink-0" />
                          <span>
                            <span className="font-medium">
                              {t.from || "A student"}
                            </span>{" "}
                            <span className="text-slate-300">
                              {reaction.label}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={toggleFullscreen}
                  data-tooltip={wbFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  title={wbFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  className="absolute right-2 top-2 z-30 flex h-8 w-8 items-center justify-center rounded-md bg-white/90 text-slate-500 shadow-sm ring-1 ring-slate-200 backdrop-blur transition-colors hover:bg-white hover:text-slate-700"
                >
                  {wbFullscreen ? (
                    <Minimize size={16} />
                  ) : (
                    <Maximize size={16} />
                  )}
                </button>
              </div>
            </section>

            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5">
              <BottomControl
                Icon={micEnabled ? Mic : MicOff}
                label={
                  !isHost && forceMuted && !micEnabled
                    ? "Muted by host"
                    : "Mic"
                }
                active={micEnabled}
                danger={!isHost && forceMuted && !micEnabled}
                disabled={!isHost && forceMuted && !micEnabled}
                onClick={toggleMic}
              />

              <BottomControl
                Icon={cameraEnabled ? Camera : VideoOff}
                label="Camera"
                active={cameraEnabled}
                onClick={toggleCamera}
              />
              {isHost && (
                <BottomControl
                  Icon={ScreenShare}
                  label={sharingScreen ? "Stop Sharing" : "Share"}
                  active={sharingScreen}
                  onClick={startScreenShare}
                />
              )}
              {isHost && (
                <BottomControl
                  Icon={PencilRuler}
                  label="Tools"
                  active={showDrawTools}
                  onClick={() => setShowDrawTools((v) => !v)}
                />
              )}
              <BottomControl
                Icon={Presentation}
                label="Materials"
                active={showMaterials}
                onClick={() => {
                  setMaterialsPageId(activePageId || pages[0]?.pageId || null);
                  setShowMaterials(true);
                }}
              />

              {isHost && (
                <BottomControl
                  Icon={Vote}
                  label="Quiz"
                  active={showQuizPanel}
                  onClick={() => setShowQuizPanel((v) => !v)}
                />
              )}

              {isHost && (
                <BottomControl
                  Icon={CalendarCheck}
                  label="Attendance"
                  active={showAttendancePanel}
                  onClick={() => setShowAttendancePanel((v) => !v)}
                />
              )}
              {!isHost && (
                <div className="relative flex flex-1">
                  {showFeedbackMenu && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowFeedbackMenu(false)}
                    />
                  )}
                  <BottomControl
                    Icon={ThumbsUp}
                    label="Feedback"
                    active={showFeedbackMenu}
                    onClick={() => setShowFeedbackMenu((v) => !v)}
                  />
                  {showFeedbackMenu && (
                    <div className="absolute bottom-full right-0 z-50 mb-2 w-44 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                      {REACTIONS.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => handleSendReaction(r.id)}
                          data-tooltip={r.label}
                          title={r.label}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          <r.Icon size={16} className="shrink-0" />
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="flex w-[340px] flex-shrink-0 flex-col gap-4 overflow-hidden">
            {participants.map((p) => (
              <AudioRelay
                key={p.socketId}
                stream={
                  Object.values(p.videoStreams || {}).find(
                    (s) => s.id !== hostScreenStreamId
                  ) || null
                }
                onAutoplayBlocked={handleAutoplayBlocked}
              />
            ))}

            <div className="flex flex-[2] flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setRightTab("participants")}
                  data-tooltip="Participants"
                  title="Participants"
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
                  data-tooltip="Chat"
                  title="Chat"
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
                          <Mic
                            size={16}
                            className="text-slate-400"
                            role="img"
                            aria-label="Microphone on"
                          />
                        ) : (
                          <MicOff
                            size={16}
                            className="text-red-400"
                            role="img"
                            aria-label="Microphone off"
                          />
                        )}
                        {cameraEnabled ? (
                          <Video
                            size={16}
                            className="text-slate-400"
                            role="img"
                            aria-label="Camera on"
                          />
                        ) : (
                          <VideoOff
                            size={16}
                            className="text-red-400"
                            role="img"
                            aria-label="Camera off"
                          />
                        )}
                      </div>
                    </div>

                    {participants.length === 0 && (
                      <p className="text-xs text-slate-400">
                        Waiting for others to join this session...
                      </p>
                    )}

                    {participants.map((p) => {
                      const isRowHost = p.user?.role === "teacher";
                      const zoomable = isHost && !isRowHost;
                      return (
                        <div
                          key={p.socketId}
                          onDoubleClick={
                            zoomable ? handleRowDoubleClick(p) : undefined
                          }
                          onTouchEnd={
                            zoomable ? handleRowTouchEnd(p) : undefined
                          }
                          title={
                            zoomable
                              ? "Double-click (or double-tap) to zoom in on camera"
                              : undefined
                          }
                          className={`flex items-center justify-between ${
                            zoomable ? "cursor-pointer" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <ParticipantThumb
                              stream={
                                Object.values(p.videoStreams || {}).find(
                                  (s) => s.id !== hostScreenStreamId
                                ) || null
                              }
                              active={p.cameraEnabled}
                              name={p.user?.name}
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
                                <button
                                  onClick={() =>
                                    p.micEnabled
                                      ? handleMuteStudent(p.socketId)
                                      : handleUnmuteStudent(p.socketId)
                                  }
                                  data-tooltip={
                                    p.micEnabled
                                      ? "Mute student microphone"
                                      : mutedParticipants.has(p.socketId)
                                        ? "Muted by host (Click to unmute)"
                                        : "Unmute student microphone"
                                  }
                                  title={
                                    p.micEnabled
                                      ? "Mute student"
                                      : mutedParticipants.has(p.socketId)
                                        ? "Muted by host (Click to unmute)"
                                        : "Unmute student"
                                  }
                                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                    p.micEnabled
                                      ? "bg-red-100 text-red-500 hover:bg-red-200"
                                      : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                                  }`}
                                >
                                  {p.micEnabled ? (
                                    <VolumeOff size={16} />
                                  ) : (
                                    <Volume2 size={16} />
                                  )}
                                </button>

                                <button
                                  onClick={() => handleKickStudent(p.socketId)}
                                  data-tooltip="Remove Student"
                                  title="Remove student"
                                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-200"
                                >
                                  <UserX size={16} />
                                </button>

                                {p.cameraEnabled && (
                                  <button
                                    onClick={() =>
                                      handleForceCameraOff(p.socketId)
                                    }
                                    data-tooltip="Camera Off"
                                    title="Turn off camera"
                                    className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-500"
                                  >
                                    <CameraOff size={16} />
                                  </button>
                                )}
                              </>
                            )}
                            {p.micEnabled ? (
                              <Mic
                                size={16}
                                className="text-slate-400"
                                role="img"
                                aria-label="Microphone on"
                              />
                            ) : (
                              <MicOff
                                size={16}
                                className="text-red-400"
                                role="img"
                                aria-label="Microphone off"
                              />
                            )}
                            {p.cameraEnabled ? (
                              <Video
                                size={16}
                                className="text-slate-400"
                                role="img"
                                aria-label="Camera on"
                              />
                            ) : (
                              <VideoOff
                                size={16}
                                className="text-red-400"
                                role="img"
                                aria-label="Camera off"
                              />
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
                    <label htmlFor="live-chat-input" className="sr-only">
                      Chat message
                    </label>
                    <input
                      id="live-chat-input"
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
                      data-tooltip="Send Message"
                      title="Send message"
                      aria-label="Send message"
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white p-3 shadow-sm">
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                <Camera size={16} />
                {isHost ? "Camera" : "Teacher"}
              </h4>
              <div className="flex-1 overflow-hidden">
                {isHost ? (
                  <div className="relative h-full min-h-[9rem] overflow-hidden rounded-xl bg-black shadow-sm">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`h-full w-full origin-center object-cover [transform:scaleX(-1)] ${
                        cameraEnabled ? "" : "opacity-0"
                      }`}
                    />

                    {!cameraEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                        <img
                          src={avatarFor(currentUser?.name)}
                          alt={currentUser?.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      </div>
                    )}

                    {mediaError && (
                      <button
                        onClick={
                          mediaError === "Camera unavailable."
                            ? toggleCamera
                            : retryCamera
                        }
                        data-tooltip="Retry Camera"
                        title="Retry"
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
                          data-tooltip="Switch Camera"
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
                            data-tooltip={d.label || `Camera ${i + 1}`}
                            title={d.label || `Camera ${i + 1}`}
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
                ) : teacherParticipant ? (
                  <TeacherCameraTile
                    stream={teacherCameraStream}
                    active={teacherParticipant.cameraEnabled}
                    name={teacherParticipant.user?.name}
                  />
                ) : (
                  <div className="flex h-full min-h-[9rem] items-center justify-center rounded-xl bg-slate-800 text-xs text-slate-400">
                    Waiting for the host to join...
                  </div>
                )}
              </div>
            </div>
          </aside>
        </main>
      </div>

      {showMaterials && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setShowMaterials(false)}
        >
          <div
            className="flex h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-48 shrink-0 overflow-y-auto border-r border-slate-100 p-3">
              <h4 className="mb-2 text-sm font-bold text-slate-800">
                Materials
              </h4>
              <div className="space-y-1">
                {pages.length === 0 && (
                  <p className="text-xs text-slate-400">No pages yet.</p>
                )}
                {pages.map((p) => (
                  <button
                    key={p.pageId}
                    onClick={() => setMaterialsPageId(p.pageId)}
                    data-tooltip={p.name}
                    title={p.name}
                    className={`block w-full truncate rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                      materialsPageId === p.pageId
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                <span className="text-sm font-medium text-slate-700">
                  {pages.find((p) => p.pageId === materialsPageId)?.name ||
                    "Select a page"}
                </span>
                <button
                  onClick={() => setShowMaterials(false)}
                  data-tooltip="Close Materials"
                  title="Close"
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden bg-slate-50 p-3">
                <div
                  ref={materialsCanvasWrapRef}
                  className="flex h-full w-full items-center justify-center"
                >
                  <canvas
                    ref={materialsCanvasRef}
                    className="rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHostExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Leave or End Session?
                </h3>
                <p className="text-xs text-slate-500">
                  {participants.length > 1
                    ? `${participants.length - 1} student(s) currently in this session`
                    : "You are the host of this live session"}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              If you leave temporarily, students remain in the room and you can rejoin at any time. If you end the session, it will close for everyone.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleLeaveTemporarily}
                data-tooltip="Leave Room"
                title="Leave Temporarily"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition"
              >
                <LogOut size={16} />
                Leave Temporarily (Rejoin Later)
              </button>

              <button
                type="button"
                onClick={handleEndSessionForAll}
                disabled={ending}
                data-tooltip="End Session"
                title="End Session for Everyone"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition"
              >
                <X size={16} />
                {ending ? "Ending Session..." : "End Session for Everyone"}
              </button>

              <button
                type="button"
                onClick={() => setShowHostExitModal(false)}
                data-tooltip="Cancel"
                title="Cancel"
                className="w-full rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Cancel (Stay in Session)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
