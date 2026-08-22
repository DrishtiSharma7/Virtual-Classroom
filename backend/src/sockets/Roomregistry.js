// In-memory registry, keyed by roomId (== sessionId). Lives only for the
// lifetime of the process — fine for the current single-instance server;
// would need to move to Redis if the backend is ever scaled horizontally.

const rooms = new Map(); // roomId -> Map(socketId -> { socketId, user })
const boards = new Map(); // roomId -> array of committed whiteboard elements
const drawPermissions = new Map(); // roomId -> boolean (student annotation allowed)
const redoStacks = new Map(); // roomId -> array of undone elements, most-recent last
const activePages = new Map(); // roomId -> pageId the host is currently on
const screenSharing = new Map(); // roomId -> boolean (host currently screen-sharing)
const screenStreamIds = new Map(); // roomId -> the screen-share MediaStream's id, while sharing

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  return rooms.get(roomId);
}

function addParticipant(roomId, socketId, user, isHost = false) {
  const room = getRoom(roomId);
  // cameraEnabled defaults false and travels with the participant record
  // itself (not a separate room-level map, unlike screen sharing — every
  // participant can now have their own camera, not just the host) so it
  // rides along for free in listParticipants/"existing-participants" for
  // a late joiner, instead of needing its own catch-up broadcast.
  room.set(socketId, { socketId, user, isHost, cameraEnabled: false });
  return room;
}

// Camera and screen are independent: every participant can toggle their
// own camera, but only the host ever screen-shares (see
// setScreenSharing/setScreenStreamId above, which stay room-level).
function setParticipantCameraEnabled(roomId, socketId, enabled) {
  const participant = rooms.get(roomId)?.get(socketId);
  if (participant) participant.cameraEnabled = !!enabled;
}

function removeParticipant(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.delete(socketId);

  if (room.size === 0) {
    rooms.delete(roomId);
    boards.delete(roomId);
    drawPermissions.delete(roomId);
    activePages.delete(roomId);
    screenSharing.delete(roomId);
    screenStreamIds.delete(roomId);
    clearRedo(roomId);
  }
}

function listParticipants(roomId, excludeSocketId) {
  const room = rooms.get(roomId);
  if (!room) return [];

  return Array.from(room.values()).filter(
    (p) => p.socketId !== excludeSocketId,
  );
}

function findParticipant(roomId, socketId) {
  return rooms.get(roomId)?.get(socketId) || null;
}

// Finds this same person's OTHER entry in the room, if any — used when
// someone reconnects (new socketId) before their previous socket's
// disconnect has actually been detected (a dropped connection can take up
// to Socket.IO's ping-timeout to notice), which otherwise leaves both the
// stale and fresh entries in the room at once and shows that participant
// listed twice until the stale one eventually times out.
function findParticipantByUserId(roomId, userId, excludeSocketId) {
  const room = rooms.get(roomId);
  if (!room || !userId) return null;

  for (const p of room.values()) {
    if (p.socketId !== excludeSocketId && p.user?.id === userId) return p;
  }
  return null;
}

// Which room(s) is this socket currently registered in? (defensive lookup
// for disconnect handling, since 'disconnect' fires after socket.rooms has
// already been cleared by Socket.IO)
function findRoomsForSocket(socketId) {
  const found = [];
  for (const [roomId, room] of rooms.entries()) {
    if (room.has(socketId)) found.push(roomId);
  }
  return found;
}

// Whether this socket was verified, at join time, as the actual teacher who
// owns this session's classroom — not merely a user whose JWT role happens
// to say "teacher" (which would let a teacher of an unrelated classroom
// wield host powers here). See sockets/socket.js "join-room".
function isTeacher(roomId, socketId) {
  const p = findParticipant(roomId, socketId);
  return p?.isHost === true;
}

// Is there currently any verified host connected to this room? Used to
// decide whether to arm/disarm the teacher-inactivity auto-end timer.
function hasActiveHost(roomId) {
  const room = rooms.get(roomId);
  if (!room) return false;
  for (const p of room.values()) {
    if (p.isHost) return true;
  }
  return false;
}

function getBoard(roomId) {
  return boards.get(roomId) || [];
}

function pushBoardElement(roomId, element) {
  const board = boards.get(roomId) || [];
  board.push(element);
  boards.set(roomId, board);
}

function clearBoard(roomId) {
  boards.set(roomId, []);
}

// ---- Student-annotation permission (teacher-controlled, default OFF) ----
function getAllowStudentDraw(roomId) {
  return drawPermissions.get(roomId) === true;
}

function setAllowStudentDraw(roomId, allow) {
  drawPermissions.set(roomId, !!allow);
}

// Whether this specific socket is currently allowed to draw on the given
// room's board: the teacher always can; a student only while the teacher
// has annotation turned on for that room. Trusts socket.user (verified by
// the JWT socket-auth middleware), never a client-supplied role.
function canDraw(roomId, socketId) {
  if (isTeacher(roomId, socketId)) return true;

  const participant = findParticipant(roomId, socketId);
  if (!participant) return false; // not even a member of this room

  return getAllowStudentDraw(roomId);
}

// ---- Which page the host is currently teaching on (student clients follow
// this instead of picking their own page) ----
function getActivePage(roomId) {
  return activePages.get(roomId) || null;
}

function setActivePage(roomId, pageId) {
  activePages.set(roomId, pageId);
}

// ---- Whether the host is currently screen-sharing — so a student who
// joins mid-share still gets shown it (see sockets/socket.js "join-room"),
// not just students who were already connected when it started. ----
function getScreenSharing(roomId) {
  return screenSharing.get(roomId) === true;
}

function setScreenSharing(roomId, sharing) {
  screenSharing.set(roomId, !!sharing);
}

// ---- The screen-share MediaStream's id, alongside the boolean above — lets
// a client tell apart an incoming "screen" video track from a simultaneous
// "camera" one (both now ride the same peer connection; see webrtc.socket.js
// "screen-share-status"). Always cleared together with the boolean. ----
function getScreenStreamId(roomId) {
  return screenStreamIds.get(roomId) || null;
}

function setScreenStreamId(roomId, streamId) {
  if (streamId) {
    screenStreamIds.set(roomId, streamId);
  } else {
    screenStreamIds.delete(roomId);
  }
}

// ---- Shared (server-authoritative) redo stack, keyed by room + page ----
// Composite string key so each whiteboard page has its own independent
// undo/redo history — drawing/undoing on one page must never pop or clear
// another page's queued redo.
function redoKey(roomId, pageId) {
  return `${roomId}:${pageId}`;
}

function getRedoStack(roomId, pageId) {
  return redoStacks.get(redoKey(roomId, pageId)) || [];
}

function pushRedo(roomId, pageId, element) {
  const key = redoKey(roomId, pageId);
  const stack = redoStacks.get(key) || [];
  stack.push(element);
  redoStacks.set(key, stack);
}

function popRedo(roomId, pageId) {
  const key = redoKey(roomId, pageId);
  const stack = redoStacks.get(key) || [];
  const element = stack.pop();
  redoStacks.set(key, stack);
  return element;
}

// A fresh draw invalidates whatever was queued up for redo — standard
// undo/redo semantics. Called with just `roomId` (no `pageId`) when a whole
// room is torn down (see removeParticipant above) — in that case every
// page's redo stack for the room is swept, since the composite key always
// starts with `${roomId}:`.
function clearRedo(roomId, pageId) {
  if (pageId === undefined) {
    for (const key of redoStacks.keys()) {
      if (key.startsWith(`${roomId}:`)) redoStacks.delete(key);
    }
    return;
  }
  redoStacks.delete(redoKey(roomId, pageId));
}

module.exports = {
  addParticipant,
  removeParticipant,
  listParticipants,
  findParticipant,
  findParticipantByUserId,
  findRoomsForSocket,
  isTeacher,
  hasActiveHost,
  getBoard,
  pushBoardElement,
  clearBoard,
  getAllowStudentDraw,
  setAllowStudentDraw,
  canDraw,
  getActivePage,
  setActivePage,
  getScreenSharing,
  setScreenSharing,
  getScreenStreamId,
  setScreenStreamId,
  setParticipantCameraEnabled,
  getRedoStack,
  pushRedo,
  popRedo,
  clearRedo,
};