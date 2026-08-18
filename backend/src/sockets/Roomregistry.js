// In-memory registry, keyed by roomId (== sessionId). Lives only for the
// lifetime of the process — fine for the current single-instance server;
// would need to move to Redis if the backend is ever scaled horizontally.

const rooms = new Map(); // roomId -> Map(socketId -> { socketId, user })
const boards = new Map(); // roomId -> array of committed whiteboard elements
const drawPermissions = new Map(); // roomId -> boolean (student annotation allowed)
const redoStacks = new Map(); // roomId -> array of undone elements, most-recent last

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  return rooms.get(roomId);
}

function addParticipant(roomId, socketId, user) {
  const room = getRoom(roomId);
  room.set(socketId, { socketId, user });
  return room;
}

function removeParticipant(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.delete(socketId);

  if (room.size === 0) {
    rooms.delete(roomId);
    boards.delete(roomId);
    drawPermissions.delete(roomId);
    redoStacks.delete(roomId);
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

function isTeacher(roomId, socketId) {
  const p = findParticipant(roomId, socketId);
  return p?.user?.role === "teacher";
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

// ---- Shared (server-authoritative) redo stack, keyed by room ----
function getRedoStack(roomId) {
  return redoStacks.get(roomId) || [];
}

function pushRedo(roomId, element) {
  const stack = redoStacks.get(roomId) || [];
  stack.push(element);
  redoStacks.set(roomId, stack);
}

function popRedo(roomId) {
  const stack = redoStacks.get(roomId) || [];
  const element = stack.pop();
  redoStacks.set(roomId, stack);
  return element;
}

// A fresh draw invalidates whatever was queued up for redo — standard
// undo/redo semantics.
function clearRedo(roomId) {
  redoStacks.set(roomId, []);
}

module.exports = {
  addParticipant,
  removeParticipant,
  listParticipants,
  findParticipant,
  findRoomsForSocket,
  isTeacher,
  getBoard,
  pushBoardElement,
  clearBoard,
  getAllowStudentDraw,
  setAllowStudentDraw,
  canDraw,
  getRedoStack,
  pushRedo,
  popRedo,
  clearRedo,
};