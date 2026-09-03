const rooms = new Map();
const boards = new Map();
const drawPermissions = new Map();
const redoStacks = new Map();
const activePages = new Map();
const screenSharing = new Map();
const screenStreamIds = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  return rooms.get(roomId);
}

function addParticipant(roomId, socketId, user, isHost = false) {
  const room = getRoom(roomId);
  room.set(socketId, {
    socketId,
    user,
    isHost,
    cameraEnabled: false,
    micEnabled: false,
    forceMuted: false,
  });
  return room;
}

function setParticipantCameraEnabled(roomId, socketId, enabled) {
  const participant = rooms.get(roomId)?.get(socketId);
  if (participant) participant.cameraEnabled = !!enabled;
}

function setParticipantMicEnabled(roomId, socketId, enabled) {
  const participant = rooms.get(roomId)?.get(socketId);
  if (participant) participant.micEnabled = !!enabled;
}

function setParticipantForceMuted(roomId, socketId, forceMuted) {
  const participant = rooms.get(roomId)?.get(socketId);
  if (participant) participant.forceMuted = !!forceMuted;
}

function isForceMuted(roomId, socketId) {
  const participant = rooms.get(roomId)?.get(socketId);
  return participant?.forceMuted === true;
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

function findParticipantByUserId(roomId, userId, excludeSocketId) {
  const room = rooms.get(roomId);
  if (!room || !userId) return null;

  for (const p of room.values()) {
    if (p.socketId !== excludeSocketId && p.user?.id === userId) return p;
  }
  return null;
}

function findRoomsForSocket(socketId) {
  const found = [];
  for (const [roomId, room] of rooms.entries()) {
    if (room.has(socketId)) found.push(roomId);
  }
  return found;
}

function isTeacher(roomId, socketId) {
  const p = findParticipant(roomId, socketId);
  return p?.isHost === true;
}

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

function getAllowStudentDraw(roomId) {
  return drawPermissions.get(roomId) === true;
}

function setAllowStudentDraw(roomId, allow) {
  drawPermissions.set(roomId, !!allow);
}

function canDraw(roomId, socketId) {
  if (isTeacher(roomId, socketId)) return true;

  const participant = findParticipant(roomId, socketId);
  if (!participant)
    return false;

  return getAllowStudentDraw(roomId);
}

function getActivePage(roomId) {
  return activePages.get(roomId) || null;
}

function setActivePage(roomId, pageId) {
  activePages.set(roomId, pageId);
}

function getScreenSharing(roomId) {
  return screenSharing.get(roomId) === true;
}

function setScreenSharing(roomId, sharing) {
  screenSharing.set(roomId, !!sharing);
}

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
  setParticipantMicEnabled,
  setParticipantForceMuted,
  isForceMuted,
  getRedoStack,
  pushRedo,
  popRedo,
  clearRedo,
};