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

  // Teacher toggled screen sharing on/off. The video track itself already
  // reaches students through the existing peer connection — camera and
  // screen now ride as two independent tracks/senders (see
  // createPeerConnection/pushScreenTrack on the frontend), so this signal's
  // job is telling a student's UI *which* incoming track is the screen:
  // streamId is the screen MediaStream's id, which WebRTC's msid mechanism
  // preserves end-to-end, so the receiver can match it against
  // event.streams[0].id in its ontrack handler and route that track to the
  // whiteboard overlay instead of the camera tile. Stored in the registry
  // too so a student who joins mid-share is told immediately on
  // "join-room", not just students who were already connected when sharing
  // started.
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

  // Any participant (host or student — everyone can have a camera now)
  // turned their own camera on/off. A disabled MediaStreamTrack still
  // arrives at a receiver as a live track (WebRTC sends black frames, not
  // "no track") — there's no way to tell "camera off" apart from "camera
  // on but black" just from the track itself, so this explicit signal,
  // tagged with who it's about, is what lets every other client show the
  // avatar fallback instead of a black box for that specific participant.
  // Stored on their participant record so a late joiner sees the current
  // state immediately via "existing-participants", not just future
  // toggles.
  socket.on("camera-status", ({ roomId, enabled } = {}) => {
    if (!roomId) return;
    if (!registry.findParticipant(roomId, socket.id)) return;

    registry.setParticipantCameraEnabled(roomId, socket.id, enabled);
    socket.to(roomId).emit("camera-status", {
      sender: socket.id,
      enabled: !!enabled,
    });
  });

  // Teacher forces a specific participant's camera off — mirrors
  // "mute-student" below. The target's own client is what actually flips
  // its local track off (see "force-camera-off" handled client-side); this
  // just delivers that instruction and updates the shared roster/registry
  // the same way a normal "camera-status" toggle would, so every other
  // client's view of that participant's camera state stays correct too.
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
