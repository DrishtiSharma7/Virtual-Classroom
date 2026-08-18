const registry = require("../../sockets/roomRegistry");
const Whiteboard = require("./whiteboard.model");

module.exports = (io, socket) => {
  // Every drawing-type action (draw, undo, redo) goes through this same
  // gate: the teacher always passes; a student passes only while the
  // teacher currently has "Allow Students to Draw" turned on for this
  // room. This is checked server-side against socket.user (set by the
  // verified-JWT socket-auth middleware) — never against anything the
  // client claims in the payload — so a student can't bypass the
  // frontend's read-only toolbar by hand-crafting a socket event.
  const requireDrawPermission = (roomId, action, message) => {
    if (registry.canDraw(roomId, socket.id)) return true;

    socket.emit("action-denied", { action, message });
    return false;
  };

  const requireTeacher = (roomId, action, message) => {
    if (registry.isTeacher(roomId, socket.id)) return true;

    socket.emit("action-denied", { action, message });
    return false;
  };

  const currentPermissionPayload = (roomId) => ({
    allowStudentDraw: registry.getAllowStudentDraw(roomId),
  });

  // Covers pencil/brush/highlighter strokes, erasing (sent as a white/
  // background-colour path), and shapes/text — the existing project
  // models all of these as one polymorphic "element" object, so one
  // event type is enough; a teacher-only "erase" event that duplicates
  // this would just be more surface area for the same thing.
  socket.on("draw", async (data) => {
    if (!data?.roomId) return;
    if (
      !requireDrawPermission(
        data.roomId,
        "whiteboard-draw",
        "You don't have permission to draw on this board.",
      )
    ) {
      return;
    }

    if (data.element) {
      // A fresh action invalidates whatever redo history existed —
      // standard undo/redo semantics, and keeps the shared redo stack
      // from ever restoring an element "after" something newer.
      registry.clearRedo(data.roomId);

      try {
        await Whiteboard.findOneAndUpdate(
          { session: data.roomId },
          { $push: { elements: data.element } },
          { upsert: true, setDefaultsOnInsert: true },
        );
      } catch (err) {
        console.error("Whiteboard persist error:", err.message);
      }
    }

    // Sender already rendered this locally for instant feedback — only
    // broadcast to everyone else in the room.
    socket.to(data.roomId).emit("draw", data);
  });

  // Live, not-yet-committed strokes — purely ephemeral so there's nothing
  // to persist here; the eventual "draw" event still saves the final
  // version. This is what makes a stroke visible to everyone else while
  // it's actually being dragged, instead of only appearing once the
  // drawer releases the mouse.
  socket.on("draw-preview", (data) => {
    if (!data?.roomId || !data.element) return;
    if (!registry.canDraw(data.roomId, socket.id)) return;
    socket.to(data.roomId).emit("draw-preview", data);
  });

  // Marks a live stroke as finished so other clients can drop their
  // temporary overlay for it (the "draw" broadcast supplies the final one).
  socket.on("draw-preview-end", (data) => {
    if (!data?.roomId) return;
    socket.to(data.roomId).emit("draw-preview-end", data);
  });

  // Legacy/explicit erase event, kept for any client that emits it
  // directly instead of a white-stroke "draw" path. Same permission gate.
  socket.on("erase", (data) => {
    if (!data?.roomId) return;
    if (
      !requireDrawPermission(
        data.roomId,
        "whiteboard-draw",
        "You don't have permission to erase on this board.",
      )
    ) {
      return;
    }
    socket.to(data.roomId).emit("erase", data);
  });

  // Shared undo: pops the most recently committed element off the
  // server's authoritative board (regardless of which participant drew
  // it), pushes it onto that room's redo stack, and broadcasts the
  // resulting full board to EVERY participant — including the sender —
  // so nobody's local view can drift out of sync with anyone else's.
  socket.on("undo", async (data) => {
    const roomId = typeof data === "string" ? data : data?.roomId;
    if (!roomId) return;
    if (
      !requireDrawPermission(
        roomId,
        "whiteboard-undo",
        "You don't have permission to undo on this board.",
      )
    ) {
      return;
    }

    try {
      const board = await Whiteboard.findOne({ session: roomId });
      const elements = board?.elements || [];
      if (!elements.length) return;

      const last = elements[elements.length - 1];
      const remaining = elements.slice(0, -1);

      await Whiteboard.findOneAndUpdate(
        { session: roomId },
        { $set: { elements: remaining } },
        { upsert: true },
      );

      registry.pushRedo(roomId, last);
      io.to(roomId).emit("board-sync", {
        elements: remaining,
        ...currentPermissionPayload(roomId),
      });
    } catch (err) {
      console.error("Whiteboard undo error:", err.message);
    }
  });

  // Shared redo: restores the most recently undone element (if any) and
  // broadcasts the resulting full board to everyone, same as undo above.
  socket.on("redo", async (data) => {
    const roomId = typeof data === "string" ? data : data?.roomId;
    if (!roomId) return;
    if (
      !requireDrawPermission(
        roomId,
        "whiteboard-redo",
        "You don't have permission to redo on this board.",
      )
    ) {
      return;
    }

    const restored = registry.popRedo(roomId);
    if (!restored) return; // nothing queued to redo — quiet no-op

    try {
      const board = await Whiteboard.findOneAndUpdate(
        { session: roomId },
        { $push: { elements: restored } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      io.to(roomId).emit("board-sync", {
        elements: board?.elements || [],
        ...currentPermissionPayload(roomId),
      });
    } catch (err) {
      console.error("Whiteboard redo error:", err.message);
    }
  });

  // Clear board stays teacher-only regardless of the student-annotation
  // toggle — it's a board-wide control, not a drawing action.
  socket.on("clear-board", async (payload) => {
    const roomId = typeof payload === "string" ? payload : payload?.roomId;
    if (!roomId) return;
    if (
      !requireTeacher(
        roomId,
        "whiteboard-clear",
        "Only the host can clear the whiteboard.",
      )
    ) {
      return;
    }

    try {
      await Whiteboard.findOneAndUpdate(
        { session: roomId },
        { $set: { elements: [] } },
        { upsert: true },
      );
    } catch (err) {
      console.error("Whiteboard clear error:", err.message);
    }

    registry.clearRedo(roomId);
    io.to(roomId).emit("clear-board");
  });

  // Teacher-only: flip whether students may currently draw. Broadcast to
  // the whole room (including the teacher) so every client's toolbar
  // reflects the same state.
  socket.on("set-draw-permission", (payload) => {
    const roomId = payload?.roomId;
    const allow = !!payload?.allow;
    if (!roomId) return;
    if (
      !requireTeacher(
        roomId,
        "whiteboard-permission",
        "Only the host can change drawing permissions.",
      )
    ) {
      return;
    }

    registry.setAllowStudentDraw(roomId, allow);
    io.to(roomId).emit("draw-permission-changed", {
      allowStudentDraw: allow,
    });
  });

  // Reconnect / late-join: read straight from the DB, so a dropped
  // connection, page refresh, or even a fresh server instance all
  // return the same board — not whatever happened to still be in memory.
  // Also returns the current student-annotation permission so a
  // reconnecting/late-joining client's toolbar starts in the right state.
  socket.on("request-board-sync", async (roomId) => {
    if (!roomId) return;

    try {
      const board = await Whiteboard.findOne({ session: roomId });
      socket.emit("board-sync", {
        elements: board?.elements || [],
        ...currentPermissionPayload(roomId),
      });
    } catch (err) {
      console.error("Whiteboard sync error:", err.message);
      socket.emit("board-sync", {
        elements: [],
        ...currentPermissionPayload(roomId),
      });
    }
  });
};
