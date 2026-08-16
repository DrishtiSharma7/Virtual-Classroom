const registry = require("../../sockets/roomRegistry");

module.exports = (io, socket) => {
  // A student's client should never be able to reach these, since the
  // draw toolbar/handlers are removed from the student UI entirely — but
  // the check here is what actually enforces it if a modified client
  // tries anyway.
  const requireTeacher = (roomId) => {
    if (registry.isTeacher(roomId, socket.id)) return true;

    socket.emit("action-denied", {
      action: "whiteboard-draw",
      message: "Only the host can draw on the whiteboard.",
    });
    return false;
  };

  socket.on("draw", (data) => {
    if (!data?.roomId || !requireTeacher(data.roomId)) return;

    if (data.element) {
      registry.pushBoardElement(data.roomId, data.element);
    }

    socket.to(data.roomId).emit("draw", data);
  });

  socket.on("erase", (data) => {
    if (!data?.roomId || !requireTeacher(data.roomId)) return;

    socket.to(data.roomId).emit("erase", data);
  });

  socket.on("clear-board", (payload) => {
    const roomId = typeof payload === "string" ? payload : payload?.roomId;
    if (!roomId || !requireTeacher(roomId)) return;

    registry.clearBoard(roomId);
    io.to(roomId).emit("clear-board");
  });

  // A newly-joined client (typically a student, but works for anyone)
  // asks for the current board state instead of starting from a blank
  // canvas. Server replies only to that socket with the full committed
  // element list built up from the teacher's "draw" events so far.
  socket.on("request-board-sync", (roomId) => {
    if (!roomId) return;
    socket.emit("board-sync", { elements: registry.getBoard(roomId) });
  });
};