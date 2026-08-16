const registerChatEvents = require("../features/chat/chat.socket");
const registerWhiteboardEvents = require("../features/whiteboard/whiteboard.socket");
const registerWebRTCEvents = require("../features/webrtc/webrtc.socket");
const registerQuizEvents = require("../features/Quiz/quiz.socket");
const socketAuth = require("./socketAuth.middleware");
const registry = require("./roomRegistry");

module.exports = (io) => {
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(
      "User Connected :",
      socket.id,
      socket.user?.name,
      socket.user?.role,
    );

    // Bug #2 fix: this is the single real "join" handshake. It joins the
    // Socket.IO room, registers the participant (with their authenticated
    // user/role) in the shared room registry, tells the JOINING client who
    // is already in the room via "existing-participants" (so it can
    // initiate WebRTC offers to each of them), and tells EVERYONE ELSE that
    // a new participant arrived via "user-joined".
    socket.on("join-room", (payload) => {
      const roomId = typeof payload === "string" ? payload : payload?.roomId;
      if (!roomId) return;

      if (socket.rooms.has(roomId)) return; // already joined, don't re-announce

      const existing = registry.listParticipants(roomId, socket.id);

      socket.join(roomId);
      registry.addParticipant(roomId, socket.id, socket.user);

      socket.emit("existing-participants", existing);

      socket.to(roomId).emit("user-joined", {
        socketId: socket.id,
        user: socket.user,
      });

      console.log(socket.id, "joined room", roomId);
    });

    socket.on("leave-room", (payload) => {
      const roomId = typeof payload === "string" ? payload : payload?.roomId;
      if (!roomId || !socket.rooms.has(roomId)) return;

      socket.leave(roomId);
      registry.removeParticipant(roomId, socket.id);

      socket.to(roomId).emit("user-left", {
        socketId: socket.id,
        user: socket.user,
      });

      console.log(socket.id, "left room", roomId);
    });

    registerChatEvents(io, socket);
    registerWhiteboardEvents(io, socket);
    registerWebRTCEvents(io, socket);
    registerQuizEvents(io, socket);

    socket.on("disconnect", () => {
      // socket.rooms is already cleared by Socket.IO by the time
      // "disconnect" fires, so use the registry (not socket.rooms) to find
      // which rooms this socket needs to be cleaned out of.
      const rooms = registry.findRoomsForSocket(socket.id);

      rooms.forEach((roomId) => {
        registry.removeParticipant(roomId, socket.id);
        socket.to(roomId).emit("user-left", {
          socketId: socket.id,
          user: socket.user,
        });
      });

      console.log("User Disconnected :", socket.id);
    });
  });
};
