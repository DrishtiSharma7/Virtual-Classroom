import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
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
  ChevronDown,
  SlidersHorizontal,
  Layers,
  GripVertical,
  Download,
  BadgeQuestionMark,
  Hand,
  Turtle,
  CalendarCheck,
} from "lucide-react";

import { getSession, endSession } from "../../../auth/api/session.api";
import { getChatHistory } from "../../../classroom/api/chat.api";
import TeacherQuizPanel from "../../../classroom/components/QuizPanel/TeacherQuizPanel";
import StudentQuizPanel from "../../../classroom/components/QuizPanel/StudentQuizPanel";
import LiveAttendancePanel from "../../../classroom/components/AttendancePanel/LiveAttendancePanel";
import { getWhiteboard } from "../../../classroom/api/whiteboard.api";
import usePageMeta from "../../../../hooks/usePageMeta";

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

// Fixed logical size every whiteboard element's x/y/size is recorded in,
// independent of any one client's actual canvas pixel dimensions. Every
// draw — replaying stored elements or a live in-progress stroke — goes
// through a scale transform mapping this fixed space onto whatever the
// live canvas's current CSS size actually is (see the resize effect and
// getCanvasPos below), and the Materials preview / PDF export reuse it
// too. Without this, elements were effectively recorded in "whatever this
// one canvas happened to be sized at draw time" — so a client whose own
// canvas later resized bigger (most noticeably: entering fullscreen) would
// see old content stay pinned at its original small size, with empty
// board visible around it, instead of scaling up to fill the new size.
const BOARD_WIDTH = 1600;
const BOARD_HEIGHT = 900;

// Student quick-feedback options — icons instead of emoji, per lucide-react
// (already used for every other icon in this file). reactionId is the only
// part that actually travels over the wire (see "send-reaction"/
// "receive-reaction"); the server just validates it against its own known
// set (chat.socket.js) and relays it straight through, so both the sender's
// popover and the host's toast look up the matching Icon/label from here.
const REACTIONS = [
  { id: "got-it", Icon: ThumbsUp, label: "Got it" },
  { id: "confused", Icon: BadgeQuestionMark, label: "Confused" },
  { id: "raise-hand", Icon: Hand, label: "Raise hand" },
  { id: "slow-down", Icon: Turtle, label: "Slow down" },
];

/* ---------------- Reusable Pieces ---------------- */

const SidebarIcon = ({ Icon, active, onClick, label }) => (
  <button
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
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
  iconClassName,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
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

// flex-1 + min-w-0 (rather than a fixed width) so every button matches
// regardless of label length ("Mic" vs "Share Screen"/"Stop Sharing" vs
// "Muted by host") *and* the whole row always divides evenly across
// whatever width it's given — shrinking together to stay on one line
// instead of wrapping once there are more than a handful of buttons.
const BottomControl = ({ Icon, label, active, danger, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    className={`flex h-14 w-0 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-1.5 text-sm font-medium transition-colors ${
      danger
        ? "text-red-500"
        : active
          ? "bg-indigo-50 text-indigo-600"
          : "text-slate-600 hover:bg-slate-100"
    }`}
  >
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
        danger
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

// Small circular per-row thumbnail for the Participants list — matches
// the list's existing h-10 w-10 avatar sizing so a live camera swaps in
// without changing the row's layout. Never muted: for every OTHER
// participant, this is the only place their audio plays from — this app
// has no dedicated <audio> element, incoming audio only ever plays by
// riding along inside whichever <video> holds the grouped stream (see
// createPeerConnection) — so it stays mounted whenever `stream` exists at
// all, with the avatar overlay purely a visual swap while `active` is
// false.
// Muted — audio playback for this participant comes from AudioRelay
// (below) instead, which stays mounted regardless of which right-panel
// tab is open. This thumbnail only exists while the Participants tab
// itself is visible, so if IT played audio too, switching to Chat and
// back (or just having both mounted at once) would double it up.
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

// The actual, tab-independent home for a participant's audio. This app has
// no dedicated <audio> element anywhere — sound only ever plays by riding
// along inside a <video>'s grouped stream — and every OTHER <video> that
// might carry it (ParticipantThumb, TeacherCameraTile) either only exists
// while a particular tab is open or is deliberately muted. One of these,
// hidden but always mounted, is rendered per participant regardless of UI
// state, so audio never depends on what's currently on screen.
const AudioRelay = ({ stream }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;
  return <video ref={videoRef} autoPlay playsInline className="hidden" />;
};

// Fills a student's Camera panel with the teacher's feed — a student's own
// camera box shows the teacher, not themselves (their own camera still
// turns on/off via the same "Camera" control, it's just not the thing
// shown here; see the JSX below). Same always-mounted-for-audio pattern as
// ParticipantThumb, just sized to fill the panel instead of a list row.
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

// Fills its container edge-to-edge (unlike the tiles above's fixed
// aspect-ratio) and uses object-contain rather than object-cover — a
// shared screen is content to read, cropping it to fill a box would cut
// off exactly the part someone's trying to show.
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

/* ---------------- Main Component ---------------- */

export default function LiveClassroom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

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
  // Guards toggleCamera's lazy getUserMedia call against a rapid
  // double-click firing a second concurrent request/addTrack.
  const togglingCameraRef = useRef(false);
  // Same guard, for toggleMic's retry-on-denial path below.
  const togglingMicRef = useRef(false);
  // Camera and screen ride as two independent tracks/senders per peer
  // connection now (so both can be live at once) — these track which
  // RTCRtpSender is carrying which, keyed by target socketId, so
  // pushCameraTrack/pushScreenTrack know whether to replaceTrack (a sender
  // already exists) or addTrack (it doesn't yet) for a given connection.
  const cameraSenders = useRef({});
  const screenSenders = useRef({});

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
  // Host-side, this mirrors `sharingScreen` (the host obviously knows when
  // it's sharing). On a student's client, this is the only way to know —
  // set from the "screen-share-status" broadcast below — since otherwise a
  // student's peer connection just sees "the teacher's video track
  // changed" with no indication of whether that's their camera or their
  // screen.
  const [hostSharingScreen, setHostSharingScreen] = useState(false);
  // Every participant can have a camera now (not just the host), so
  // there's no single "host camera" flag any more — each participant's
  // own cameraEnabled lives on their entry in `participants` instead (see
  // reconcileParticipant and the "camera-status" listener below). Same
  // reasoning as hostSharingScreen: a disabled MediaStreamTrack still
  // arrives at a receiver as a live track (WebRTC sends black frames, not
  // "no track"), so this explicit per-participant signal is what the
  // avatar-fallback check actually gates on, not track presence.
  // The screen-share MediaStream's id, broadcast alongside the boolean
  // above — WebRTC's msid mechanism preserves this end-to-end, so once a
  // video track arrives whose stream.id matches this, that's the screen
  // (see the derived teacherScreenStream below); anything else incoming
  // from the teacher is their camera.
  const [hostScreenStreamId, setHostScreenStreamId] = useState(null);
  // The host's own local screen preview, for their whiteboard overlay —
  // mirrors screenStream.current as state so it can drive a render (a ref
  // alone wouldn't). Local-only; students get their copy via the peer
  // connection instead (see teacherScreenStream below).
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
  // Current BOARD_WIDTH/HEIGHT -> live-canvas-CSS-size scale factors, kept
  // in sync by the resize effect below and read by getCanvasPos so a
  // freshly drawn stroke's coordinates land in the same logical space as
  // everything already on the board.
  const boardScaleRef = useRef({ x: 1, y: 1 });
  const colorInputRef = useRef(null);
  // Multi-page whiteboard: each page's committed elements live in this map,
  // keyed by pageId, so switching tabs never needs a server round-trip —
  // every page's content arrives up front on "board-sync". Kept in a ref
  // (not state) so a stroke mid-drag doesn't re-render the whole component.
  const boardsRef = useRef({});
  // Page tab metadata only ({pageId, name}) — deliberately excludes
  // `elements` so the tab strip never re-renders on every stroke.
  const [pages, setPages] = useState([]);
  const [activePageId, setActivePageId] = useState(null);
  // Mirrors `activePageId` for the long-lived socket listeners below (set
  // up once per socket connection, not re-created on every tab switch) —
  // they read this ref instead of closing over the possibly-stale state
  // value, so switching tabs never has to tear down and reconnect the
  // socket just to keep them current.
  const activePageIdRef = useRef(null);
  // Redo is now server-authoritative (see the "redo" socket handler), so
  // this only tracks *whether* a redo is plausible for disabling the
  // button — the actual stack of undone elements lives on the backend,
  // shared by every participant. Keyed by pageId: each page has its own
  // independent undo/redo history.
  const hasRedoRef = useRef({});
  const drawStateRef = useRef({ isDrawing: false, current: null });
  // Other participants' strokes that are still being dragged (not yet
  // committed on mouse-up). Keyed by element id so each remote pointer's
  // in-progress line renders and updates independently. Only ever holds
  // strokes for the page currently being viewed — a live stroke on a page
  // nobody's looking at isn't worth tracking, it'll arrive as a normal
  // "draw" once committed.
  const remoteLiveRef = useRef({});
  // "Tools" bottom-bar toggle (host-only) — purely local, like wbZoom/
  // wbFullscreen: hides/shows the drawing toolbar (Pencil/Eraser/Color/
  // etc. below) to declutter the host's own view, without affecting what
  // students see or their own ability to draw if allowStudentDraw is on.
  const [showDrawTools, setShowDrawTools] = useState(true);
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
    setCanUndo((boardsRef.current[activePageId]?.length || 0) > 0);
    setCanRedo(!!hasRedoRef.current[activePageId]);
  }, [historyTick, activePageId]);

  // Whiteboard-specific state: kept deliberately separate from call state
  // (see the "connected" flag used for signaling) so a whiteboard hiccup
  // never gets confused in the UI with the video/audio call itself.
  const [allowStudentDraw, setAllowStudentDraw] = useState(false);
  const [wbZoom, setWbZoom] = useState(1);
  const [wbFullscreen, setWbFullscreen] = useState(false);
  const [wbError, setWbError] = useState("");
  // Guards handleDownloadAllBoards against a rapid double-click re-running
  // the export while the first one is still rendering pages.
  const [downloadingBoards, setDownloadingBoards] = useState(false);
  // Which toolbar popover (if any) is open — "color" or "style" (stroke
  // size + opacity). Folding these behind a single trigger button each is
  // what keeps the toolbar down to one compact row instead of spelling out
  // every swatch/slider inline.
  const [openPanel, setOpenPanel] = useState(null);

  // "Materials" panel — a read-only browser over every whiteboard page
  // (not just the one the host currently has active), available to
  // everyone. Deliberately independent of activePageId/the live canvas:
  // opening it and picking a different page here never touches what's
  // actually being taught live, it just previews boardsRef's already-
  // loaded content for whichever page is selected.
  const [showMaterials, setShowMaterials] = useState(false);
  const [materialsPageId, setMaterialsPageId] = useState(null);
  const materialsCanvasRef = useRef(null);
  const materialsCanvasWrapRef = useRef(null);

  // Student "Feedback" quick-reactions — the popover of choices, and the
  // host's incoming toast queue. Each toast carries its own id (not just
  // the reaction's) so two students sending the same reaction seconds
  // apart both get their own entry/timer instead of colliding.
  const [showFeedbackMenu, setShowFeedbackMenu] = useState(false);
  const [reactionToasts, setReactionToasts] = useState([]);

  const [removedNotice, setRemovedNotice] = useState("");
  const [forceMuted, setForceMuted] = useState(false);
  const [mutedParticipants, setMutedParticipants] = useState(() => new Set());

  const isHost =
    !!session &&
    !!currentUser &&
    (session.createdBy?._id === currentUser.id ||
      session.createdBy === currentUser.id);

  // Mirrors `isHost` for createPeerConnection to read without depending on
  // it directly (see that callback's own comment) — session loads
  // asynchronously, so isHost flips false -> true shortly after mount for
  // the host specifically; closing over it directly would change
  // createPeerConnection's identity at that moment, which — since the main
  // socket effect depends on createPeerConnection — tore down and
  // recreated the entire socket connection right as the host's session
  // became ready, exactly when students might be joining.
  const isHostRef = useRef(false);
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

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
     Every participant can have a camera now (screen sharing stays the only
     host-only video feature) — this effect requests audio only, for
     everyone, on join. Camera permission is requested separately, on
     demand, the first time someone clicks "Camera" (see toggleCamera),
     which is also what adds the video track to every peer connection via
     WebRTC renegotiation. */
  useEffect(() => {
    if (sessionLoading) return; // wait until we actually know isHost
    let cancelled = false;

    const initMedia = async () => {
      try {
        // Video is never requested here — camera permission is only asked
        // for lazily, the moment someone actually clicks "Camera" (see
        // toggleCamera below). Screen sharing doesn't need camera access
        // at all (getDisplayMedia is a fully separate API), so there was
        // never a reason to prompt for it just to join.
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Captured tracks default to enabled — join muted for everyone
        // until they explicitly turn the mic on (toggleMic below just
        // flips `.enabled` when a track already exists; if this request
        // was denied, it instead retries getUserMedia on click).
        stream.getAudioTracks().forEach((t) => (t.enabled = false));

        localStream.current = stream;
        setCameraEnabled(false);
      } catch (err) {
        console.log(err);
        if (!cancelled) {
          setMediaError("Microphone unavailable.");
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

  /* ---- List available cameras — every participant can have one now ---- */
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

  /* ---- Peer connection factory, keyed by the remote socket id ---- */
  const createPeerConnection = useCallback(
    (targetId) => {
      // Defensive: a reconnect (Socket.IO's automatic reconnection, or any
      // other path that re-runs "existing-participants") would otherwise
      // silently overwrite this entry with a fresh RTCPeerConnection while
      // the old one — never closed — leaks.
      peerConnections.current[targetId]?.close();

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnections.current[targetId] = pc;

      localStream.current?.getAudioTracks().forEach((track) => {
        pc.addTrack(track, localStream.current);
      });

      // Camera and screen are two independent tracks/senders, so a
      // brand-new connection (e.g. someone joins, refreshes, or reconnects
      // mid-share/mid-camera) needs to pick up whichever of them are
      // currently live — otherwise the other side would only see them
      // once their owner happens to toggle again. Each is tagged into its
      // own sender ref (cameraSenders/screenSenders) so a later
      // pushCameraTrack/pushScreenTrack call knows to replaceTrack this
      // sender instead of adding a duplicate one. Camera is every
      // participant's own — screen sharing stays host-only, since only
      // the teacher ever presents.
      const camTrack = localStream.current?.getVideoTracks()[0];
      if (camTrack) {
        cameraSenders.current[targetId] = pc.addTrack(
          camTrack,
          localStream.current
        );
      }

      if (isHostRef.current) {
        const scrTrack = screenStream.current?.getVideoTracks()[0];
        if (scrTrack) {
          screenSenders.current[targetId] = pc.addTrack(
            scrTrack,
            screenStream.current
          );
        }
      }

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;

        socketRef.current?.emit("ice-candidate", {
          roomId: sessionId,
          target: targetId,
          candidate: event.candidate,
        });
      };

      // Camera and screen can both be live at once now, as two separate
      // tracks, so this fires once per track rather than once per
      // participant — each track's own MediaStream (event.streams[0],
      // whichever `stream` argument the sender's addTrack call used) is
      // collected into a map keyed by that stream's id. Which entry is the
      // camera vs the screen is decided later, from hostScreenStreamId
      // (see teacherScreenStream below, and each participant's own
      // videoStreams for their camera thumbnail) — WebRTC's msid
      // mechanism preserves the sender's stream.id end-to-end, so it
      // reliably tells them apart regardless of arrival order.
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) return;

        setParticipants((prev) =>
          prev.map((p) => {
            if (p.socketId !== targetId) return p;
            if (p.videoStreams?.[stream.id] === stream) return p;
            return {
              ...p,
              videoStreams: { ...(p.videoStreams || {}), [stream.id]: stream },
            };
          })
        );
      };

      // Single source of truth for every offer this connection ever sends
      // — the very first one (triggered by the addTrack calls above) and
      // any later one (e.g. the host turning their camera on mid-call,
      // which calls pc.addTrack again in toggleCamera/pushCameraTrack).
      // `makingOffer` isn't guarding against
      // cross-peer glare — only the host ever originates a renegotiation
      // for a given connection, so two-sided collision can't happen here —
      // it's just insurance against this handler re-entering itself.
      let makingOffer = false;
      pc.onnegotiationneeded = async () => {
        try {
          if (makingOffer) return;
          makingOffer = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit("offer", {
            roomId: sessionId,
            target: targetId,
            offer,
          });
        } catch (err) {
          // pc may already be closed (e.g. the peer left mid-negotiation)
          // — non-fatal, nothing to recover.
          console.log(err);
        } finally {
          makingOffer = false;
        }
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

    // BOARD_WIDTH/HEIGHT directly, not canvas.width/height — the resize
    // effect's transform already maps that fixed logical space onto
    // whatever the canvas's actual current size is, so clearing exactly
    // that logical rect always covers the full visible canvas.
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    const elements = boardsRef.current[activePageIdRef.current] || [];
    elements.forEach((el) => drawElement(ctx, el));
    // Live strokes other people are still dragging get painted on top,
    // so they're visible while moving instead of only after they let go.
    Object.values(remoteLiveRef.current).forEach((el) => drawElement(ctx, el));
  }, []);

  // Shared by the initial REST load and the socket "board-sync" handler:
  // seeds every page's elements into boardsRef, populates the tab-strip
  // metadata, and switches to whichever page the server says the host is
  // currently teaching on. Students never pick their own page, so this is
  // always taken from the server, including on reconnect (not just first
  // load) — a stale local selection from before a disconnect must not win.
  const applyBoardPages = useCallback((incomingPages, serverActivePageId) => {
    const list = Array.isArray(incomingPages) ? incomingPages : [];
    list.forEach((p) => {
      boardsRef.current[p.pageId] = Array.isArray(p.elements) ? p.elements : [];
    });
    setPages(list.map((p) => ({ pageId: p.pageId, name: p.name })));
    hasRedoRef.current = {};
    setActivePageId(serverActivePageId || list[0]?.pageId || null);
  }, []);

  // Once the active page switches — whether from a manual tab click or
  // because the page we were viewing just got deleted out from under us —
  // repaint from that page's stored elements. Also keeps activePageIdRef
  // current for the socket listeners registered below.
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

      // Maps BOARD_WIDTH/HEIGHT (the fixed logical space every element's
      // x/y is recorded in) onto whatever this canvas's size actually is
      // right now — recalculated on every resize (including a fullscreen
      // toggle, which is what the ResizeObserver below also catches),
      // which is what makes existing content fill the canvas instead of
      // staying pinned at its original small size while extra board
      // becomes visible around it.
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
    // sessionLoading is a dependency (not just redrawCanvas) because the
    // canvas/wrap refs are null on the very first render — this component
    // shows a "Loading session..." placeholder instead of the board until
    // the session finishes loading, so this effect must re-run once that
    // flips to false and the real <canvas> actually exists in the DOM.
  }, [redrawCanvas, sessionLoading]);

  // Materials panel's own tiny read-only render — separate canvas, separate
  // effect, deliberately not touching redrawCanvas/ctxRef (those belong to
  // the live board). Re-runs whenever the panel opens or a different page
  // is picked inside it; reads straight from boardsRef, which already has
  // every page's elements loaded regardless of which one is "active".
  useEffect(() => {
    if (!showMaterials || !materialsPageId) return;
    const canvas = materialsCanvasRef.current;
    const wrap = materialsCanvasWrapRef.current;
    if (!canvas || !wrap) return;

    const { width: availWidth, height: availHeight } =
      wrap.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    // Every element's x/y lives in the fixed BOARD_WIDTH x BOARD_HEIGHT
    // space (see its own comment) regardless of any live canvas's actual
    // size — sizing THIS canvas to that same aspect ratio, as large as
    // fits the panel, is what makes the preview fill edge to edge with no
    // empty margins on either side.
    const scale = Math.min(availWidth / BOARD_WIDTH, availHeight / BOARD_HEIGHT);
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
        // guard in case the canvas hasn't sized yet
        if (ctxRef.current) redrawCanvas();
        bumpHistory();
      })
      .catch((err) => console.log("Whiteboard history error:", err));
  }, [sessionId, applyBoardPages, redrawCanvas, bumpHistory]);

  // Divides out the current CSS zoom (wbZoom, the manual +/- viewer
  // control) so drawing coordinates always map back into the canvas's
  // real (unscaled) pixel space, then divides out boardScaleRef too — the
  // automatic BOARD_WIDTH/HEIGHT -> canvas-size mapping from the resize
  // effect — so a freshly drawn point lands in the same fixed logical
  // space every existing element is already recorded in, regardless of
  // this particular canvas's current pixel size.
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
      // This is the actual choke point for outgoing draw events — guarding
      // it here (not just hiding the toolbar) means the socket emit is
      // unreachable for an unauthorized student even from a modified
      // client, since the pointer handlers below are also never attached
      // to the canvas for a non-permitted participant in the first place.
      // The backend re-checks the exact same permission independently.
      if (!canDraw || !activePageId) return;

      try {
        const pageElements = boardsRef.current[activePageId] || (boardsRef.current[activePageId] = []);
        pageElements.push(el);
        hasRedoRef.current[activePageId] = false; // a fresh action clears redo for this page
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

    // Tell everyone else this stroke is no longer "live" — the commit
    // below (or the resulting "draw" broadcast) supplies the final version.
    socketRef.current?.emit("draw-preview-end", {
      roomId: sessionId,
      pageId: activePageId,
      id: current.id,
    });

    if (current.type === "path" && current.points.length < 2) return;

    commitElement(current);
  };

  // Undo/redo are shared, server-authoritative actions, scoped to whichever
  // page is currently active: the client just asks the server to
  // pop/restore the last element on that page, and the resulting page
  // content comes back over "page-sync" to every participant (including
  // this one) so everyone stays in lockstep even when both teacher and
  // students have been drawing.
  const handleUndo = () => {
    if (!canDraw || !canUndo || !activePageId) return;
    try {
      socketRef.current?.emit("undo", { roomId: sessionId, pageId: activePageId });
    } catch (err) {
      console.error("Whiteboard undo error:", err);
    }
  };

  const handleRedo = () => {
    if (!canDraw || !activePageId) return;
    try {
      socketRef.current?.emit("redo", { roomId: sessionId, pageId: activePageId });
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

  // Host-only: add a new blank page. The server auto-names it and
  // broadcasts "page-added" to everyone (including this socket), which is
  // what actually updates `pages`/`boardsRef` and switches this client to
  // it — no optimistic local state here, so a rejected/failed add never
  // leaves the tab strip out of sync with the server.
  const handleAddPage = () => {
    if (!isHost) return;
    socketRef.current?.emit("add-page", { roomId: sessionId });
  };

  // Host-only: remove a page (never the last one — the button is hidden
  // in that case, and the server rejects it too as a backstop).
  const handleDeletePage = (pageId) => {
    if (!isHost) return;
    if (!window.confirm("Delete this whiteboard page?")) return;
    socketRef.current?.emit("delete-page", { roomId: sessionId, pageId });
  };

  // Exports every whiteboard page as one PDF, one page per board — not
  // host-only, since it's just a read-only export of what's already
  // visible to whoever clicks it. Reuses boardsRef directly (every page's
  // elements are already loaded there via applyBoardPages, regardless of
  // which page is currently active — see its own comment) rather than
  // switching through each page's live canvas, and reuses the same
  // drawElement helper the live canvas uses so the export renders
  // identically. Renders each page onto a throwaway offscreen canvas
  // sized to the current canvas viewport (not the live canvas's own
  // devicePixelRatio-scaled backing size) so exported strokes line up
  // with what's on screen without also exporting at zoom level.
  const handleDownloadAllBoards = async () => {
    if (!pages.length || downloadingBoards) return;
    setDownloadingBoards(true);

    try {
      const ratio = window.devicePixelRatio || 1;
      // BOARD_WIDTH/HEIGHT directly — every element's x/y already lives in
      // that fixed space regardless of any client's actual live canvas
      // size, so exporting at that same resolution needs no fit/scale math
      // at all, unlike a size read from whatever this client's canvas
      // currently happens to be.
      const width = BOARD_WIDTH;
      const height = BOARD_HEIGHT;
      const orientation = width >= height ? "landscape" : "portrait";

      const doc = new jsPDF({ orientation, unit: "px", format: [width, height] });

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

  // Host-only (the tab strip itself is hidden from students — see the JSX
  // below). Switching locally is instant; the broadcast is what makes
  // every student's canvas follow along in real time.
  const switchPage = (pageId) => {
    setActivePageId(pageId);
    if (isHost) {
      socketRef.current?.emit("switch-page", { roomId: sessionId, pageId });
    }
  };

  // Drag-and-drop reorder of the page tabs. Native HTML5 DnD (no extra
  // dependency) — dragPageIdRef tracks the source across the drag (a ref,
  // not state, since drag events fire far too often to re-render on),
  // dragOverPageId is state purely for the drop-target highlight.
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

  // Reordering the tabs is host-only UI (students never see the strip), so
  // no permission check here beyond that — the server re-checks anyway.
  // Persisted immediately so the new order survives a refresh/reconnect,
  // not just a live broadcast to whoever else is connected right now.
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

    // If `prev` already has an entry for this same person under a
    // DIFFERENT (now-stale) socketId, replace it in place instead of just
    // appending — otherwise they'd show up twice. This is needed on top of
    // the server-side reconnect fix: if THIS client was itself briefly
    // disconnected while that other participant also reconnected, this
    // client never received their "user-left"/"user-joined" pair for it
    // (Socket.IO can't deliver events while offline) — so its local state
    // is still holding their pre-disconnect entry when a fresh snapshot
    // arrives with their new socketId.
    const reconcileParticipant = (
      prev,
      { socketId, user, cameraEnabled: theirCameraEnabled }
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
        const next = [...prev];
        next[staleIdx] = {
          socketId,
          user,
          videoStreams: {},
          cameraEnabled: !!theirCameraEnabled,
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
        },
      ];
    };

    // The server tells us who's already in this session's room; we're the
    // offerer to each of them. Just creating the connection is enough —
    // createPeerConnection's addTrack call(s) queue a negotiation-needed
    // check, so its onnegotiationneeded handler sends the actual offer.
    // (Deliberately NOT also calling createOffer/setLocalDescription
    // manually here — doing both raced: the queued onnegotiationneeded
    // check isn't guaranteed to lose to a manual createOffer/
    // setLocalDescription pair completing first, so both could end up
    // sending a competing offer for the same connection.)
    socket.on("existing-participants", (existing) => {
      setParticipants((prev) =>
        existing.reduce((acc, p) => reconcileParticipant(acc, p), prev)
      );

      existing.forEach(({ socketId }) => createPeerConnection(socketId));
    });

    // Someone else joined after us - just track them for the UI; the peer
    // connection is created once their offer arrives.
    socket.on("user-joined", ({ socketId, user }) => {
      setParticipants((prev) => reconcileParticipant(prev, { socketId, user }));
    });

    socket.on("offer", async ({ sender, offer }) => {
      // Reuse the existing connection if this sender already has one —
      // this "offer" may be a renegotiation (e.g. the host just turned
      // their camera on), not just the very first handshake. Recreating
      // the connection here would tear down whatever was already live.
      const pc = peerConnections.current[sender] || createPeerConnection(sender);
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
      delete cameraSenders.current[socketId];
      delete screenSenders.current[socketId];
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // A student sent a quick-feedback reaction — queue it as a toast and
    // let it expire itself after a few seconds. Only meaningfully shown
    // to the host (see the JSX below); a student's own client would only
    // ever get here from someone else's reaction anyway, since sending
    // one closes their own popover instead of echoing it back.
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
      try {
        // The final version has landed — it no longer needs a live overlay.
        if (element.id) delete remoteLiveRef.current[element.id];
        const pageElements =
          boardsRef.current[pageId] || (boardsRef.current[pageId] = []);
        pageElements.push(element);
        // A page nobody's currently viewing is just buffered — no point
        // repainting a canvas that isn't showing it.
        if (pageId === activePageIdRef.current) {
          redrawCanvas();
          bumpHistory();
        }
      } catch (err) {
        // Isolated on purpose: a bad incoming whiteboard element must
        // never crash the classroom page, the call, or any other panel.
        console.error("Whiteboard render error:", err);
        setWbError("Had trouble rendering the last whiteboard update.");
      }
    });

    // Someone else's stroke, still being dragged — render it live instead
    // of waiting for them to release the mouse. Only tracked for the page
    // we're actually looking at; a live stroke on another page will just
    // arrive as a normal "draw" once committed.
    socket.on("draw-preview", ({ pageId, element }) => {
      if (!element?.id || pageId !== activePageIdRef.current) return;
      remoteLiveRef.current[element.id] = element;
      redrawCanvas();
    });

    socket.on("draw-preview-end", ({ pageId, id }) => {
      if (pageId !== activePageIdRef.current) return;
      if (id) delete remoteLiveRef.current[id];
      redrawCanvas();
    });

    // Page-scoped sync — used after a "clear-board", "undo", or "redo" on
    // one page. Other pages on the same board are untouched.
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

    // Host added a new page — everyone's tab strip gains it; this client
    // also switches straight to it (mirrors every other client seeing the
    // host's own action land the same way).
    socket.on("page-added", ({ pageId, name, elements }) => {
      if (!pageId) return;
      boardsRef.current[pageId] = Array.isArray(elements) ? elements : [];
      setPages((prev) => [...prev, { pageId, name }]);
      setActivePageId(pageId);
    });

    // Host deleted a page — drop it everywhere. If it was the page we were
    // looking at, the activePageId-driven effect above falls back to the
    // first remaining tab and redraws.
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

    // Host switched to a different existing page — students (who have no
    // tab strip of their own) follow along automatically. The host never
    // receives its own broadcast back (server excludes the sender), so
    // this only ever fires for everyone else.
    socket.on("active-page-changed", ({ pageId }) => {
      if (pageId) setActivePageId(pageId);
    });

    // Host dragged the tabs into a new order — persisted server-side, this
    // just reflects it locally. Only the tab-strip metadata reorders here;
    // boardsRef (each page's actual content) is untouched.
    socket.on("pages-reordered", ({ pageIds }) => {
      if (!Array.isArray(pageIds)) return;
      setPages((prev) => {
        const byId = new Map(prev.map((p) => [p.pageId, p]));
        const next = pageIds.map((id) => byId.get(id)).filter(Boolean);
        prev.forEach((p) => {
          if (!next.includes(p)) next.push(p); // defensive: never drop a page
        });
        return next;
      });
    });

    // Full-board replacement — used only for the initial sync on
    // join/reconnect. The server is always the source of truth here: we
    // never merge this with whatever stale local state we already had, we
    // replace it outright, so a client that missed individual events while
    // disconnected still ends up correct.
    socket.on("board-sync", ({ pages: syncedPages, activePageId: syncedActivePageId, allowStudentDraw: allow }) => {
      applyBoardPages(syncedPages, syncedActivePageId);
      remoteLiveRef.current = {};
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

    // Teacher started/stopped screen sharing — the track itself arrives
    // through the existing peer connection regardless (as its own sender,
    // alongside the camera's), so this just tells a student's UI which
    // incoming stream is the screen: streamId is that MediaStream's id,
    // which the derived teacherScreenStream below matches against each
    // incoming stream's own id to sort it out.
    socket.on("screen-share-status", ({ sharing, streamId }) => {
      setHostSharingScreen(!!sharing);
      setHostScreenStreamId(sharing ? streamId || null : null);
    });

    // Some participant (host or student) turned their own camera on/off —
    // update just their entry in the roster. See the comment near
    // cameraEnabled's declaration above for why this can't just be
    // inferred from the incoming track.
    socket.on("camera-status", ({ sender, enabled }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.socketId === sender ? { ...p, cameraEnabled: !!enabled } : p
        )
      );
    });

    // Teacher forced THIS client's camera off — flip the local track (no
    // separate emit back: the server already broadcasts the resulting
    // "camera-status" to everyone, including this client, once it
    // processes "force-camera-off").
    socket.on("force-camera-off", () => {
      const track = localStream.current?.getVideoTracks()[0];
      if (track) track.enabled = false;
      setCameraEnabled(false);
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

    // Backend rejected the room join (not authorized for this session's
    // classroom) — never trust the frontend's own isHost/enrollment
    // assumptions, the server is the actual gate. Reuses the same
    // notice-then-redirect overlay as being removed.
    socket.on("session-error", ({ message }) => {
      setRemovedNotice(message || "Unable to join this session.");
    });

    // Session auto-ended (e.g. host inactivity timeout) rather than an
    // explicit end-session call — same overlay/redirect treatment.
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
    socketRef.current.emit("request-board-sync", { roomId: sessionId });
  }, [connected, mediaReady, sessionId, currentUser]);

  /* ---- Cleanup local media + peer connections on unmount ---- */
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

  // Every participant can toggle their own camera now (not just the
  // host — see createPeerConnection, which only keeps screen sharing
  // host-only). Camera permission is requested lazily, right here, the
  // first time this is called — never eagerly on join (see initMedia
  // above).
  const toggleCamera = async () => {
    const existingTrack = localStream.current?.getVideoTracks()[0];
    if (existingTrack) {
      existingTrack.enabled = !existingTrack.enabled;
      setCameraEnabled(existingTrack.enabled);
      // The track itself is unaffected on the receiving end by this local
      // .enabled flip (WebRTC just switches to/from sending black frames)
      // — this explicit signal is what actually lets a student's UI show
      // the avatar fallback instead of a black box while it's off.
      socketRef.current?.emit("camera-status", {
        roomId: sessionId,
        enabled: existingTrack.enabled,
      });
      return;
    }

    if (togglingCameraRef.current) return;
    togglingCameraRef.current = true;

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      const videoTrack = videoStream.getVideoTracks()[0];
      if (!videoTrack) return;

      // localStream.current can be null here — e.g. the audio-only
      // getUserMedia in initMedia was denied at join — in which case
      // there's no existing stream to add this track into; adopt the
      // fresh one instead. Skipping this check and calling
      // pushCameraTrack below with a null stream throws (RTCPeerConnection
      // .addTrack's second argument must be an actual MediaStream), which
      // silently aborted the whole toggle before reaching setCameraEnabled
      // — camera permission would be granted and the device would turn on,
      // but the UI never reflected it.
      if (localStream.current) {
        localStream.current.addTrack(videoTrack);
      } else {
        localStream.current = videoStream;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }

      setActiveCameraId(videoTrack.getSettings().deviceId || null);

      // Triggers each connection's onnegotiationneeded handler, which
      // sends a fresh offer — the renegotiation this whole feature depends
      // on. Independent of any screen-share sender on the same connection.
      pushCameraTrack(videoTrack);

      setCameraEnabled(true);
      socketRef.current?.emit("camera-status", {
        roomId: sessionId,
        enabled: true,
      });
    } catch (err) {
      console.log(err);
      setMediaError("Camera unavailable.");
    } finally {
      togglingCameraRef.current = false;
    }
  };

  const toggleMic = async () => {
    const existingTrack = localStream.current?.getAudioTracks()[0];
    if (existingTrack) {
      existingTrack.enabled = !existingTrack.enabled;
      setMicEnabled(existingTrack.enabled);
      if (existingTrack.enabled) setForceMuted(false);
      return;
    }

    // No audio track — most likely the getUserMedia call in initMedia (at
    // join) was denied or failed. Ask again right here instead of quietly
    // doing nothing forever: a user who blocked it by mistake, or whose
    // browser prompted while the tab wasn't focused, gets another shot at
    // the permission prompt the moment they actually click Mic.
    if (togglingMicRef.current) return;
    togglingMicRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const track = stream.getAudioTracks()[0];
      if (!track) return;

      if (localStream.current) {
        localStream.current.addTrack(track);
      } else {
        localStream.current = stream;
      }

      // Wire it into every connection already established without audio
      // — mirrors toggleCamera's addTrack loop for the same reason.
      Object.values(peerConnections.current).forEach((pc) => {
        pc.addTrack(track, localStream.current);
      });

      setMicEnabled(true);
      setForceMuted(false);
      setMediaError("");
    } catch (err) {
      console.log(err);
      setMediaError("Microphone unavailable.");
    } finally {
      togglingMicRef.current = false;
    }
  };

  // Camera and screen each get their own sender per peer connection, kept
  // in cameraSenders/screenSenders so a later call knows whether to swap
  // the track in place (sender already exists — no renegotiation needed)
  // or add it fresh (triggers onnegotiationneeded, same as any addTrack).
  const pushCameraTrack = (track) => {
    // pc.addTrack's second argument must be an actual MediaStream —
    // passing null here (e.g. if localStream.current was never
    // initialized) throws and, since callers await nothing after this,
    // silently aborts whatever they were doing. Callers are expected to
    // ensure localStream.current exists before calling this; this is just
    // the last line of defense against a hard crash if one doesn't.
    if (!localStream.current) return;

    Object.entries(peerConnections.current).forEach(([targetId, pc]) => {
      const sender = cameraSenders.current[targetId];
      if (sender) {
        sender.replaceTrack(track);
      } else if (track) {
        cameraSenders.current[targetId] = pc.addTrack(
          track,
          localStream.current
        );
      }
    });
  };

  const pushScreenTrack = (track) => {
    Object.entries(peerConnections.current).forEach(([targetId, pc]) => {
      const sender = screenSenders.current[targetId];
      if (sender) {
        sender.replaceTrack(track);
      } else if (track) {
        screenSenders.current[targetId] = pc.addTrack(
          track,
          screenStream.current
        );
      }
    });
  };

  // Screen sharing actually stops (rather than just pausing, like the mic/
  // camera mute pattern) — removing the sender drops its m-line on the
  // next renegotiation, so a receiver's incoming screen stream disappears
  // instead of freezing on the last frame.
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
      // Same null-stream guard as toggleCamera — localStream.current can
      // be null if the audio-only getUserMedia at join was denied.
      if (localStream.current) {
        localStream.current.addTrack(newTrack);
      } else {
        localStream.current = newStream;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }

      // Camera and screen are independent senders now, so this no longer
      // needs to check sharingScreen first — switching devices mid-share
      // just swaps the camera sender in place, leaving the screen sender
      // (if any) completely untouched.
      pushCameraTrack(newTrack);

      setActiveCameraId(newTrack.getSettings().deviceId || deviceId);
      setCameraEnabled(true);
      setShowCameraMenu(false);
    } catch (err) {
      console.log(err);
    }
  };

  /* ---- Retry mic permission after an earlier denial/error ----
     Audio-only, matching initMedia — camera stays exclusively under
     toggleCamera's lazy control, never re-requested eagerly from here. */
  const retryCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      localStream.current = stream;
      setMediaError("");
      setMicEnabled(true);
    } catch (err) {
      console.log(err);
      setMediaError("Microphone unavailable.");
    }
  };

  const stopScreenShare = useCallback(() => {
    screenStream.current?.getTracks().forEach((t) => t.stop());
    screenStream.current = null;
    setLocalScreenPreview(null);

    // Only the screen sender goes away — the camera (if on) was always a
    // separate sender on the same connection and is completely unaffected.
    removeScreenTrack();

    setSharingScreen(false);
    socketRef.current?.emit("screen-share-status", {
      roomId: sessionId,
      sharing: false,
    });
  }, [sessionId]);

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
      setLocalScreenPreview(stream);

      // Adds as its own sender, alongside the camera's (if any) — never
      // touches it. The Camera section stays bound to localStream/
      // localVideoRef the whole time (see the JSX below), so it keeps
      // showing the actual camera throughout the share instead of being
      // hijacked into showing the screen.
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

  // Student-only, matching the button's own isHost-gated JSX below — a
  // host reaching this would just be a harmless no-op server-side anyway
  // (see "send-reaction" in chat.socket.js), this is only the UI-side
  // backstop.
  const handleSendReaction = (reactionId) => {
    if (isHost) return;
    socketRef.current?.emit("send-reaction", { roomId: sessionId, reactionId });
    setShowFeedbackMenu(false);
  };

  /* ---- Bug #5/#6: teacher-only participant controls ---- */
  const handleMuteStudent = (targetSocketId) => {
    if (!isHost || mutedParticipants.has(targetSocketId)) return;
    socketRef.current?.emit("mute-student", {
      roomId: sessionId,
      targetSocketId,
    });
  };

  // Teacher forces off a specific participant's camera — the target's own
  // client actually flips its local track (see the "force-camera-off"
  // listener above); the server's resulting "camera-status" broadcast is
  // what updates every roster, including this one, once it lands.
  const handleForceCameraOff = (targetSocketId) => {
    if (!isHost) return;
    socketRef.current?.emit("force-camera-off", {
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
    delete cameraSenders.current[targetSocketId];
    delete screenSenders.current[targetSocketId];
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

  // Shared between the whiteboard's screen-share overlay and the student
  // sidebar's "Teacher" video tile — both need the host's live stream(s).
  const teacherParticipant = participants.find(
    (p) => p.user?.role === "teacher"
  );

  // Camera and screen can both be live at once, arriving as two separate
  // tracks/streams over the same connection (see pc.ontrack above) — sort
  // them back out here. Whichever incoming stream's id matches
  // hostScreenStreamId (from the "screen-share-status" broadcast) is the
  // screen; anything else incoming from the teacher is their camera. On
  // the host's own client, the equivalent screen state is already just
  // local (sharingScreen/localScreenPreview) — this is purely for a
  // student's incoming view.
  const teacherVideoStreams = Object.values(
    teacherParticipant?.videoStreams || {}
  );
  const teacherScreenStream = hostScreenStreamId
    ? teacherVideoStreams.find((s) => s.id === hostScreenStreamId) || null
    : null;
  // A student's own Camera box shows the teacher, not themselves (see the
  // JSX below) — this is that feed.
  const teacherCameraStream =
    teacherVideoStreams.find((s) => s.id !== hostScreenStreamId) || null;

  // Which screen-share stream (if any) belongs on THIS client's whiteboard
  // overlay — the host's own local preview, or the incoming one derived
  // above, depending who's viewing.
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

          {/* Moved up from the bottom control bar — sits right under the
              classroom name/LIVE badge above, so it's reachable without
              hunting through the toolbar at the bottom of the page. */}
          <button
            onClick={handleEndOrLeave}
            disabled={ending}
            className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={14} />
            {ending ? "..." : isHost ? "End Session" : "Leave Session"}
          </button>
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left icon rail */}
        <nav className="flex w-[72px] flex-col items-center gap-4 bg-slate-900 py-5">
          <SidebarIcon Icon={Edit3} active label="Whiteboard" />
          <SidebarIcon Icon={Video} label="Video" />
          <SidebarIcon
            Icon={Users}
            onClick={() => setRightTab("participants")}
            label="Participants"
          />
          <SidebarIcon Icon={FileText} label="Files" />
          <SidebarIcon
            Icon={MessageCircle}
            onClick={() => setRightTab("chat")}
            label="Chat"
          />
          <SidebarIcon Icon={FileText} label="Recordings" />
          <SidebarIcon Icon={BarChart3} label="Analytics" />
          <div className="mt-auto">
            <SidebarIcon Icon={Settings} label="Settings" />
          </div>
        </nav>

        {/* Center + Right */}
        <main className="flex flex-1 gap-4 overflow-hidden p-4">
          {/* Board column: whiteboard + controls stacked underneath it.
              Gap kept tight (not gap-4) and the control bar below is as
              compact as it gets — both so the whiteboard itself, the
              flex-1 element here, claims as much vertical space as
              possible. */}
          <div className="flex flex-1 flex-col gap-2 overflow-hidden">
            {/* Whiteboard */}
            <section
              ref={whiteboardSectionRef}
              className={`relative flex flex-1 flex-col overflow-hidden bg-white shadow-sm ${
                wbFullscreen ? "" : "rounded-2xl"
              }`}
            >
              {/* Toolbar — visible to the host always, and to a student
                  only while the teacher has annotation turned on. Kept to a
                  single compact row (icon-only buttons, color/stroke tucked
                  behind small popovers) instead of spelling out every
                  swatch and slider inline — matches the common
                  Excalidraw/Miro-style toolbar layout. Still wraps rather
                  than disappearing on very narrow widths. */}
              {canDraw && showDrawTools && (
                <div className="relative flex flex-wrap items-center justify-between gap-y-1.5 border-b border-slate-100 px-3 py-1.5">
                  {/* Click-outside backdrop for whichever popover is open */}
                  {openPanel && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setOpenPanel(null)}
                    />
                  )}

                  <div className="flex flex-wrap items-center gap-0.5">
                    {/* Pages — host-only, folded into one popover trigger
                        (like Color/Stroke Style below) instead of a
                        persistent tab strip, so the page list never costs
                        its own row. Students never see this; their canvas
                        just follows whichever page the host has open (see
                        the "active-page-changed" socket listener). Drag to
                        reorder inside the popover, persisted server-side. */}
                    {isHost && pages.length > 0 && (
                      <div className="relative mr-1 border-r border-slate-200 pr-1">
                        <button
                          onClick={() =>
                            setOpenPanel((p) => (p === "pages" ? null : "pages"))
                          }
                          title="Pages"
                          className={`flex h-8 items-center gap-1 rounded-md px-1.5 text-xs font-medium transition-colors ${
                            openPanel === "pages"
                              ? "bg-indigo-50 text-indigo-600"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Layers size={15} />
                          <span className="max-w-[72px] truncate">
                            {pages.find((p) => p.pageId === activePageId)?.name ||
                              "Pages"}
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

                    {/* Color — single swatch trigger opens a small palette
                        popover instead of showing every color inline. */}
                    <div className="relative ml-1 border-l border-slate-200 pl-1">
                      <button
                        onClick={() =>
                          setOpenPanel((p) => (p === "color" ? null : "color"))
                        }
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

                    {/* Stroke style — size + opacity folded behind one
                        popover instead of two always-visible slider rows. */}
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
                              onChange={(e) => setPenSize(Number(e.target.value))}
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
                              onChange={(e) => setOpacity(Number(e.target.value))}
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
                    {/* Teacher-only student-annotation permission switch */}
                    {isHost && (
                      <button
                        onClick={toggleStudentDraw}
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

                    {/* Read-only export — visible to everyone, not just
                        the host, since it doesn't change the board for
                        anyone. */}
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

              {/* Small non-blocking whiteboard status strip. Shown whenever
                  the underlying socket is down or a whiteboard error was
                  reported — never a full-screen error, and it never
                  touches the call/video/audio controls. Shown to everyone,
                  not just participants who can currently draw, so a
                  disconnected student still gets a reconnecting cue. */}
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

                {/* Student side: no manual toggle — this mounts
                    unconditionally and stays invisible (StudentQuizPanel
                    itself renders null) until the teacher actually
                    launches a quiz, at which point the "quiz-launched"
                    socket event it's already listening for opens it
                    automatically. Submitted answers are persisted via the
                    existing submitQuiz REST call inside the panel, and
                    show up later in the teacher's results view. */}
                {!isHost && (
                  <div className="absolute left-[68%] top-[8%]">
                    <StudentQuizPanel
                      socket={socketRef.current}
                      sessionId={sessionId}
                      studentId={currentUser?.id}
                    />
                  </div>
                )}

                {/* While the host is screen-sharing, everyone sees it here
                    — over the whiteboard itself, not just the small
                    Camera/Teacher sidebar tile — since that's the main
                    thing to look at while it's happening. The canvas stays
                    mounted underneath (untouched) so it's exactly as it
                    was the moment sharing stops. Camera and screen are
                    independent tracks now, so the host sees their own
                    share here too (via localScreenPreview) while their
                    Camera-section tile keeps showing their actual camera,
                    unlike a single-track model where sharing would hijack
                    it. */}
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

                {/* Incoming student "Feedback" reactions — shown right on
                    the teacher's whiteboard (not floating over the whole
                    page), since that's what they're actually looking at
                    while teaching. Host-only: a student's own client only
                    ever receives someone ELSE's reaction here anyway (see
                    the "receive-reaction" listener above), but there's no
                    reason to surface classmates' feedback to every other
                    student. Each toast removes itself (see the listener's
                    own setTimeout), this just renders whatever's
                    currently queued. */}
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

                {/* Fullscreen — a view control, not a drawing one, so unlike
                    the rest of the toolbar it's visible to every
                    participant regardless of draw permission (the toolbar
                    above is canDraw-gated and a view-only student may never
                    see it at all). Floats over the canvas itself so it's
                    always reachable. */}
                <button
                  onClick={toggleFullscreen}
                  title={wbFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  className="absolute right-2 top-2 z-30 flex h-8 w-8 items-center justify-center rounded-md bg-white/90 text-slate-500 shadow-sm ring-1 ring-slate-200 backdrop-blur transition-colors hover:bg-white hover:text-slate-700"
                >
                  {wbFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
              </div>
            </section>

            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5">
              <BottomControl
                Icon={micEnabled ? Mic : MicOff}
                label={forceMuted && !micEnabled ? "Muted by host" : "Mic"}
                active={micEnabled}
                onClick={toggleMic}
              />
              {/* Camera is every participant's own now — Share Screen
                  stays host-only, since only the teacher ever presents. */}
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
                  setMaterialsPageId(
                    activePageId || pages[0]?.pageId || null
                  );
                  setShowMaterials(true);
                }}
              />
              {/* Teacher-only launcher — a student's quiz panel opens
                  itself automatically when the teacher launches one (see
                  StudentQuizPanel above), no manual button needed. */}
              {isHost && (
                <BottomControl
                  Icon={Vote}
                  label="Quiz"
                  active={showQuizPanel}
                  onClick={() => setShowQuizPanel((v) => !v)}
                />
              )}
              {/* Read-only, best-effort snapshot for the teacher during the
                  live session — the actual attendance record is computed
                  and saved automatically when the session ends. */}
              {isHost && (
                <BottomControl
                  Icon={CalendarCheck}
                  label="Attendance"
                  active={showAttendancePanel}
                  onClick={() => setShowAttendancePanel((v) => !v)}
                />
              )}
              <BottomControl Icon={DoorOpen} label="Breakout" />
              {/* Feedback is a student-facing action (rating/reacting to
                  the class) — doesn't make sense on the host's own
                  dashboard, so it's hidden for the teacher. */}
              {!isHost && (
                // flex + flex-1 here (not just relative) — BottomControl
                // relies on being a DIRECT flex child for its own flex-1/
                // w-0 sizing to take effect (see its own comment: that's
                // what keeps every button in this row equal width). A
                // plain `relative` wrapper broke that, since the button's
                // sizing classes went inert without a flex parent —
                // shrinking it to fit its content instead of matching its
                // siblings.
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
            {/* Every other participant's audio, independent of which tab
                (Participants vs Chat) happens to be open right now — see
                AudioRelay's own comment for why this can't just live
                inside the Participants tab's markup. The host hears every
                student this way; a student hears every OTHER student this
                way too, but not the teacher a second time — their audio
                already plays via the always-visible TeacherCameraTile in
                the Camera panel below. */}
            {participants
              .filter((p) => isHost || p.user?.role !== "teacher")
              .map((p) => (
                <AudioRelay
                  key={p.socketId}
                  stream={
                    Object.values(p.videoStreams || {}).find(
                      (s) => s.id !== hostScreenStreamId
                    ) || null
                  }
                />
              ))}

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
                      return (
                        <div
                          key={p.socketId}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <ParticipantThumb
                              // Exclude the screen-share stream for the
                              // teacher's row specifically — only they can
                              // have one, and this thumbnail is for their
                              // camera, not whatever they're presenting.
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
                                {/* Only actionable while their camera is
                                    actually on — nothing to force off
                                    otherwise. */}
                                {p.cameraEnabled && (
                                  <button
                                    onClick={() =>
                                      handleForceCameraOff(p.socketId)
                                    }
                                    className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-500"
                                  >
                                    Cam Off
                                  </button>
                                )}
                              </>
                            )}
                            {mutedParticipants.has(p.socketId) ? (
                              <MicOff
                                size={16}
                                className="text-red-400"
                                role="img"
                                aria-label="Microphone off"
                              />
                            ) : (
                              <Mic
                                size={16}
                                className="text-slate-400"
                                role="img"
                                aria-label="Microphone on"
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
                      aria-label="Send message"
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Host's Camera box shows their own feed (a self-check, like
                a mirror). A student's shows the teacher's instead — the
                main thing they're there to watch — while their own camera
                still turns on/off via the "Camera" control and is visible
                to the host/others through the Participants list thumbnails
                (see the "participants" tab below), it's just not shown
                back to themselves here. */}
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
                        // mediaError now comes from two independent
                        // sources (mic failure in initMedia/retryCamera,
                        // or camera failure in toggleCamera) — retry
                        // whichever one actually failed.
                        onClick={
                          mediaError === "Camera unavailable."
                            ? toggleCamera
                            : retryCamera
                        }
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

      {/* Materials — read-only browser over every whiteboard page, for
          everyone. Picking a page here only changes what THIS panel
          previews (materialsPageId); it never touches activePageId, so it
          can't accidentally drag anyone else's live view along with it. */}
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
                  <p className="text-xs text-slate-400">
                    No pages yet.
                  </p>
                )}
                {pages.map((p) => (
                  <button
                    key={p.pageId}
                    onClick={() => setMaterialsPageId(p.pageId)}
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
                  title="Close"
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden bg-slate-50 p-3">
                {/* Padding lives on the outer div specifically so this
                    inner one's own getBoundingClientRect (read in the
                    sizing effect above) reports the exact available
                    space, not the padded-out box — sizing the canvas off
                    the padded box would let it overlap the padding. */}
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
    </div>
  );
}
