// In-memory registry, keyed by roomId (== sessionId). Lives only for the
// lifetime of the process — fine for the current single-instance server;
// would need to move to Redis if the backend is ever scaled horizontally.

const rooms = new Map(); // roomId -> Map(socketId -> { socketId, user })
const boards = new Map(); // roomId -> array of committed whiteboard elements

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
};