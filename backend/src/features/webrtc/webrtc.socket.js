const registry = require("../../sockets/roomRegistry");

module.exports = (io, socket) => {
  // NOTE: room join / "existing-participants" / "user-joined" / "user-left"
  // now all live in sockets/socket.js's "join-room" handler, since that's
  // the event that actually calls socket.join() and is shared by chat,
  // whiteboard, and quiz too. "join-call" is kept only so older clients
  // that still emit it don't error — it's a no-op alias.
  socket.on("join-call", () => {
    // intentionally empty — see sockets/socket.js "join-room"
  });

  // Offer
  socket.on("offer", (data) => {
    io.to(data.target).emit("offer", {
      offer: data.offer,
      sender: socket.id,
    });
  });

  // Answer
  socket.on("answer", (data) => {
    io.to(data.target).emit("answer", {
      answer: data.answer,
      sender: socket.id,
    });
  });

  // ICE Candidate
  socket.on("ice-candidate", (data) => {
    io.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      sender: socket.id,
    });
  });

  // Leave Call — actual room membership/roster cleanup happens in
  // sockets/socket.js's "leave-room" / "disconnect" handlers.
  socket.on("leave-call", () => {
    // intentionally empty — see sockets/socket.js "leave-room"
  });

  // ---------------------------------------------------------------
  // Teacher-only classroom control. Both events trust socket.user
  // (set by the socket auth middleware from the verified JWT) for the
  // role check — never the payload — so a modified student client can't
  // just claim to be a teacher.
  // ---------------------------------------------------------------

  // Teacher mutes a specific student's outgoing audio.
  socket.on("mute-student", ({ roomId, targetSocketId }) => {
    if (!roomId || !targetSocketId) return;

    if (!registry.isTeacher(roomId, socket.id)) {
      socket.emit("action-denied", {
        action: "mute-student",
        message: "Only the host can mute participants.",
      });
      return;
    }

    io.to(targetSocketId).emit("force-mute", { by: socket.id });

    // Let the teacher's own participant list reflect the muted state
    // immediately, and let everyone else's roster stay consistent too.
    io.to(roomId).emit("student-muted", { socketId: targetSocketId });
  });

  // Teacher removes a student from the session entirely.
  socket.on("kick-student", ({ roomId, targetSocketId }) => {
    if (!roomId || !targetSocketId) return;

    if (!registry.isTeacher(roomId, socket.id)) {
      socket.emit("action-denied", {
        action: "kick-student",
        message: "Only the host can remove participants.",
      });
      return;
    }

    const target = registry.findParticipant(roomId, targetSocketId);

    io.to(targetSocketId).emit("removed-from-session", {
      message: "You have been removed from this session by the host.",
    });

    registry.removeParticipant(roomId, targetSocketId);

    // Force the target's socket out of the room and disconnect it so its
    // peer connections tear down on both ends and it can't keep emitting
    // room-scoped events.
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.leave(roomId);
      targetSocket.disconnect(true);
    }

    io.to(roomId).emit("user-left", {
      socketId: targetSocketId,
      user: target?.user,
      kicked: true,
    });
  });
};
