const registerChatEvents = require("../features/chat/chat.socket");

const registerWhiteboardEvents = require("../features/whiteboard/whiteboard.socket");

const registerWebRTCEvents = require("../features/webrtc/webrtc.socket");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User Connected :", socket.id);

    socket.on("join-room", (roomId) => {
      if (!socket.rooms.has(roomId)) {
        socket.join(roomId);

        console.log(
          socket.id,
          "joined room",
          roomId,
        );
      }
    });

    socket.on("leave-room", (roomId) => {
      if (socket.rooms.has(roomId)) {
        socket.leave(roomId);

        console.log(
          socket.id,
          "left room",
          roomId,
        );
      }
    });

    registerChatEvents(io, socket);
    registerWhiteboardEvents(io, socket);
    registerWebRTCEvents(io, socket);

    socket.on("disconnect", () => {
      console.log(
        "User Disconnected :",
        socket.id,
      );
    });
  });
};
