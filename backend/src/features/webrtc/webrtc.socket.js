const registry = require("../../sockets/roomRegistry");

module.exports = (io, socket) => {
  socket.on("join-call", () => {});

  socket.on("offer", (data) => {
    io.to(data.target).emit("offer", {
      offer: data.offer,
      sender: socket.id,
    });
  });

  socket.on("answer", (data) => {
    io.to(data.target).emit("answer", {
      answer: data.answer,
      sender: socket.id,
    });
  });

  socket.on("ice-candidate", (data) => {
    io.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      sender: socket.id,
    });
  });

  socket.on("leave-call", () => {});

  socket.on("screen-share-status", ({ roomId, sharing, streamId } = {}) => {
    if (!roomId) return;

    if (!registry.isTeacher(roomId, socket.id)) {
      socket.emit("action-denied", {
        action: "screen-share-status",
        message: "Only the host can share their screen.",
      });
      return;
    }

    registry.setScreenSharing(roomId, sharing);
    registry.setScreenStreamId(roomId, sharing ? streamId : null);
    socket.to(roomId).emit("screen-share-status", {
      sharing: !!sharing,
      streamId: sharing ? streamId : null,
    });
  });

  socket.on("camera-status", ({ roomId, enabled } = {}) => {
    if (!roomId) return;
    if (!registry.findParticipant(roomId, socket.id)) return;

    registry.setParticipantCameraEnabled(roomId, socket.id, enabled);
    socket.to(roomId).emit("camera-status", {
      sender: socket.id,
      enabled: !!enabled,
    });
  });

  socket.on("mic-status", ({ roomId, enabled } = {}) => {
    if (!roomId) return;
    if (!registry.findParticipant(roomId, socket.id)) return;

    if (enabled && registry.isForceMuted(roomId, socket.id)) {
      socket.emit("action-denied", {
        action: "mic-status",
        message: "You were muted by the host and cannot unmute yourself.",
      });
      return;
    }

    registry.setParticipantMicEnabled(roomId, socket.id, enabled);
    socket.to(roomId).emit("mic-status", {
      sender: socket.id,
      enabled: !!enabled,
    });
  });

  socket.on("force-camera-off", ({ roomId, targetSocketId } = {}) => {
    if (!roomId || !targetSocketId) return;

    if (!registry.isTeacher(roomId, socket.id)) {
      socket.emit("action-denied", {
        action: "force-camera-off",
        message: "Only the host can turn off a participant's camera.",
      });
      return;
    }

    registry.setParticipantCameraEnabled(roomId, targetSocketId, false);
    io.to(targetSocketId).emit("force-camera-off", { by: socket.id });
    io.to(roomId).emit("camera-status", {
      sender: targetSocketId,
      enabled: false,
    });
  });

  socket.on("mute-student", ({ roomId, targetSocketId }) => {
    if (!roomId || !targetSocketId) return;

    if (!registry.isTeacher(roomId, socket.id)) {
      socket.emit("action-denied", {
        action: "mute-student",
        message: "Only the host can mute participants.",
      });
      return;
    }

    registry.setParticipantMicEnabled(roomId, targetSocketId, false);
    registry.setParticipantForceMuted(roomId, targetSocketId, true);

    io.to(targetSocketId).emit("force-mute", { by: socket.id });
    io.to(roomId).emit("student-muted", { socketId: targetSocketId });
    io.to(roomId).emit("mic-status", {
      sender: targetSocketId,
      enabled: false,
    });
  });

  socket.on("unmute-student", ({ roomId, targetSocketId }) => {
    if (!roomId || !targetSocketId) return;

    if (!registry.isTeacher(roomId, socket.id)) {
      socket.emit("action-denied", {
        action: "unmute-student",
        message: "Only the host can unmute participants.",
      });
      return;
    }

    registry.setParticipantForceMuted(roomId, targetSocketId, false);
    registry.setParticipantMicEnabled(roomId, targetSocketId, true);

    io.to(targetSocketId).emit("force-unmute", { by: socket.id });
    io.to(roomId).emit("student-unmuted", { socketId: targetSocketId });
    io.to(roomId).emit("mic-status", {
      sender: targetSocketId,
      enabled: true,
    });
  });

  socket.on("kick-student", async ({ roomId, targetSocketId }) => {
    if (!roomId || !targetSocketId) return;

    if (!registry.isTeacher(roomId, socket.id)) {
      socket.emit("action-denied", {
        action: "kick-student",
        message: "Only the host can remove participants.",
      });
      return;
    }

    const target = registry.findParticipant(roomId, targetSocketId);

    if (target?.user?.id) {
      registry.kickParticipant(roomId, target.user.id);
      try {
        const Session = require("../session/session.model");
        await Session.findByIdAndUpdate(roomId, {
          $addToSet: { kickedStudents: target.user.id },
        });
      } catch (err) {
        console.error("Error persisting kicked student to session:", err.message);
      }
    }

    io.to(targetSocketId).emit("removed-from-session", {
      message: "You have been removed from this session by the host and cannot rejoin.",
    });

    registry.removeParticipant(roomId, targetSocketId);

    const targetSocket = io.sockets?.sockets?.get?.(targetSocketId);
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
