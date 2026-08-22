const registerChatEvents = require("../features/chat/chat.socket");
const registerWhiteboardEvents = require("../features/whiteboard/whiteboard.socket");
const registerWebRTCEvents = require("../features/webrtc/webrtc.socket");
const registerQuizEvents = require("../features/Quiz/quiz.socket");
const socketAuth = require("./socketAuth.middleware");
const registry = require("./roomRegistry");
const sessionLifecycle = require("./sessionLifecycle");
const { getAuthorizedSession } = require("../features/session/session.service");
const attendanceService = require("../features/attendance/attendance.service");

module.exports = (io) => {
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(
      "User Connected :",
      socket.id,
      socket.user?.name,
      socket.user?.role,
    );

    socket.on("join-room", async (payload) => {
      const roomId = typeof payload === "string" ? payload : payload?.roomId;
      if (!roomId) return;

      if (socket.rooms.has(roomId))
        return;

      let isHost = false;
      let session;
      let classroom;
      try {
        ({ isHost, session, classroom } = await getAuthorizedSession(
          roomId,
          socket.user,
        ));
      } catch (err) {
        socket.emit("session-error", {
          message: err.message || "Unable to join this session.",
        });
        return;
      }

      const stale = registry.findParticipantByUserId(
        roomId,
        socket.user.id,
        socket.id,
      );
      if (stale) {
        registry.removeParticipant(roomId, stale.socketId);
        io.sockets.sockets.get(stale.socketId)?.leave(roomId);
        io.to(roomId).emit("user-left", {
          socketId: stale.socketId,
          user: stale.user,
        });

        if (!stale.isHost) {
          try {
            await attendanceService.recordDisconnect({
              sessionId: roomId,
              studentId: stale.user.id,
            });
          } catch (err) {
            console.error("Attendance recordDisconnect (stale) error:", err.message);
          }
        }
      }

      const existing = registry.listParticipants(roomId, socket.id);

      socket.join(roomId);
      registry.addParticipant(roomId, socket.id, socket.user, isHost);

      if (isHost)
        sessionLifecycle.cancelAutoEnd(roomId);

      if (!isHost) {
        try {
          await attendanceService.recordConnect({
            session,
            classroomId: classroom._id,
            studentId: socket.user.id,
          });
        } catch (err) {
          console.error("Attendance recordConnect error:", err.message);
        }
      }

      socket.emit("existing-participants", existing);

      if (!isHost && registry.getScreenSharing(roomId)) {
        socket.emit("screen-share-status", {
          sharing: true,
          streamId: registry.getScreenStreamId(roomId),
        });
      }

      socket.to(roomId).emit("user-joined", {
        socketId: socket.id,
        user: socket.user,
      });

      console.log(socket.id, "joined room", roomId);
    });

    socket.on("leave-room", async (payload) => {
      const roomId = typeof payload === "string" ? payload : payload?.roomId;
      if (!roomId || !socket.rooms.has(roomId)) return;

      const participant = registry.findParticipant(roomId, socket.id);

      socket.leave(roomId);
      registry.removeParticipant(roomId, socket.id);

      if (participant && !participant.isHost) {
        try {
          await attendanceService.recordDisconnect({
            sessionId: roomId,
            studentId: participant.user.id,
          });
        } catch (err) {
          console.error("Attendance recordDisconnect error:", err.message);
        }
      }

      if (participant?.isHost && !registry.hasActiveHost(roomId)) {
        sessionLifecycle.scheduleAutoEnd(roomId, io);

        if (registry.getScreenSharing(roomId)) {
          registry.setScreenSharing(roomId, false);
          registry.setScreenStreamId(roomId, null);
          socket.to(roomId).emit("screen-share-status", {
            sharing: false,
            streamId: null,
          });
        }

      }

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

    socket.on("disconnect", async () => {
      const rooms = registry.findRoomsForSocket(socket.id);

      for (const roomId of rooms) {
        const participant = registry.findParticipant(roomId, socket.id);
        registry.removeParticipant(roomId, socket.id);

        if (participant && !participant.isHost) {
          try {
            await attendanceService.recordDisconnect({
              sessionId: roomId,
              studentId: participant.user.id,
            });
          } catch (err) {
            console.error("Attendance recordDisconnect error:", err.message);
          }
        }

        if (participant?.isHost && !registry.hasActiveHost(roomId)) {
          sessionLifecycle.scheduleAutoEnd(roomId, io);

          if (registry.getScreenSharing(roomId)) {
            registry.setScreenSharing(roomId, false);
            registry.setScreenStreamId(roomId, null);
            socket.to(roomId).emit("screen-share-status", {
              sharing: false,
              streamId: null,
            });
          }

        }

        socket.to(roomId).emit("user-left", {
          socketId: socket.id,
          user: socket.user,
        });
      }

      console.log("User Disconnected :", socket.id);
    });
  });
};
