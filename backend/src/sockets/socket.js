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

    // Bug #2 fix: this is the single real "join" handshake. It joins the
    // Socket.IO room, registers the participant (with their authenticated
    // user/role) in the shared room registry, tells the JOINING client who
    // is already in the room via "existing-participants" (so it can
    // initiate WebRTC offers to each of them), and tells EVERYONE ELSE that
    // a new participant arrived via "user-joined".
    //
    // Before any of that: verify this user actually belongs to the
    // classroom this session belongs to (as its teacher or an enrolled
    // student). Without this, a roomId is just a guessable string — any
    // authenticated account could join another classroom's session and,
    // worse, a teacher-role account would previously be granted full host
    // powers (clear board, mute/kick, permission toggles) in a session they
    // don't own. registry.isTeacher() is driven entirely by the verified
    // isHost flag computed here, never by the raw JWT role.
    socket.on("join-room", async (payload) => {
      const roomId = typeof payload === "string" ? payload : payload?.roomId;
      if (!roomId) return;

      if (socket.rooms.has(roomId)) return; // already joined, don't re-announce

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

      // If this same person still has a stale entry under a different
      // socketId (their previous connection dropped but Socket.IO hasn't
      // noticed yet — that can take up to its ping-timeout), evict it now
      // instead of leaving both around, which is what made a reconnecting
      // participant show up twice in everyone's list until a manual
      // refresh forced a fresh "existing-participants" snapshot.
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

        // The stale entry's own disconnect may not fire for a while (or
        // ever, if it's a genuinely stuck tab) — close its attendance
        // interval now so a fast refresh/reconnect never leaves two open
        // intervals for the same student.
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

      // Host reconnected/rejoined before the inactivity grace period
      // elapsed — the session survives.
      if (isHost) sessionLifecycle.cancelAutoEnd(roomId);

      // Attendance is tracked for students only, and only ever as a side
      // effect of this server-verified join — never from anything the
      // client sends directly (see attendance.service.recordConnect). A
      // failure here must never block the student from actually joining
      // the class.
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

      // Late joiner catch-up: if the host is already mid-screen-share, this
      // socket wasn't connected for the "screen-share-status" broadcast
      // that started it, so tell it directly — otherwise their whiteboard
      // never shows the share until the host happens to toggle it again.
      if (!isHost && registry.getScreenSharing(roomId)) {
        socket.emit("screen-share-status", {
          sharing: true,
          streamId: registry.getScreenStreamId(roomId),
        });
      }

      // No equivalent catch-up needed for camera: unlike screen sharing,
      // each participant's cameraEnabled now travels on their own
      // participant record (see registry.addParticipant), so it's already
      // included in "existing-participants" above.

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

      // The host just left and no other host socket is holding the room —
      // arm the auto-end timer instead of leaving the session "live"
      // forever (Test 13: teacher closes the tab without ending session).
      if (participant?.isHost && !registry.hasActiveHost(roomId)) {
        sessionLifecycle.scheduleAutoEnd(roomId, io);

        // The host's tab closing also silently ends whatever screen share
        // was in progress — without this, students would be stuck looking
        // at a frozen last frame over the whiteboard with no way to clear
        // it themselves.
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
      // socket.rooms is already cleared by Socket.IO by the time
      // "disconnect" fires, so use the registry (not socket.rooms) to find
      // which rooms this socket needs to be cleaned out of.
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
