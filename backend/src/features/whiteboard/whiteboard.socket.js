const registry = require("../../sockets/roomRegistry");
const Whiteboard = require("./whiteboard.model");
const { getAuthorizedSession } = require("../session/session.service");
const { getOrInitBoard } = require("./whiteboard.service");

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
    if (!data?.roomId || !data?.pageId) return;
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
      // A fresh action invalidates whatever redo history existed for THIS
      // page only — standard undo/redo semantics, and keeps the shared
      // redo stack from ever restoring an element "after" something newer.
      registry.clearRedo(data.roomId, data.pageId);

      // Idempotent persist, done in two steps because `session` is a
      // unique-indexed field: combining upsert:true directly with an
      // "elements.id": {$ne} filter would make Mongo try to INSERT a
      // second document for a session that already has one (since the
      // dedup condition makes the existing doc not match), colliding with
      // that unique index instead of just skipping the push.
      try {
        // 1) Guarantee the board doc, AND this specific page, exist.
        await getOrInitBoard(data.roomId);
        await Whiteboard.updateOne(
          { session: data.roomId, "pages.pageId": { $ne: data.pageId } },
          { $push: { pages: { pageId: data.pageId, name: "Page", elements: [] } } },
        );

        // 2) Conditionally append into the matching page's elements: if an
        // element with this id is already on that page (duplicate delivery
        // from a socket retry/reconnect), the filter matches zero docs and
        // the $push is skipped instead of duplicating the stroke.
        const filter = data.element.id
          ? {
              session: data.roomId,
              pages: {
                $elemMatch: {
                  pageId: data.pageId,
                  "elements.id": { $ne: data.element.id },
                },
              },
            }
          : { session: data.roomId, "pages.pageId": data.pageId };

        await Whiteboard.updateOne(
          filter,
          { $push: { "pages.$[p].elements": data.element } },
          { arrayFilters: [{ "p.pageId": data.pageId }] },
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

  // Shared undo: pops the most recently committed element off this page's
  // authoritative history (regardless of which participant drew it),
  // pushes it onto that page's redo stack, and broadcasts the resulting
  // page content to EVERY participant — including the sender — so nobody's
  // local view can drift out of sync with anyone else's. Other pages on the
  // same board are untouched.
  socket.on("undo", async (data) => {
    const roomId = data?.roomId;
    const pageId = data?.pageId;
    if (!roomId || !pageId) return;
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
      const board = await getOrInitBoard(roomId);
      const page = board.pages.find((p) => p.pageId === pageId);
      if (!page || !page.elements.length) return;

      const last = page.elements[page.elements.length - 1];
      const remaining = page.elements.slice(0, -1);

      await Whiteboard.updateOne(
        { session: roomId, "pages.pageId": pageId },
        { $set: { "pages.$.elements": remaining } },
      );

      registry.pushRedo(roomId, pageId, last);
      io.to(roomId).emit("page-sync", { pageId, elements: remaining });
    } catch (err) {
      console.error("Whiteboard undo error:", err.message);
    }
  });

  // Shared redo: restores the most recently undone element (if any) on
  // this page and broadcasts the resulting page content to everyone, same
  // as undo above.
  socket.on("redo", async (data) => {
    const roomId = data?.roomId;
    const pageId = data?.pageId;
    if (!roomId || !pageId) return;
    if (
      !requireDrawPermission(
        roomId,
        "whiteboard-redo",
        "You don't have permission to redo on this board.",
      )
    ) {
      return;
    }

    const restored = registry.popRedo(roomId, pageId);
    if (!restored) return; // nothing queued to redo — quiet no-op

    try {
      await getOrInitBoard(roomId);
      const board = await Whiteboard.findOneAndUpdate(
        { session: roomId, "pages.pageId": pageId },
        { $push: { "pages.$.elements": restored } },
        { new: true },
      );

      const page = board?.pages.find((p) => p.pageId === pageId);
      io.to(roomId).emit("page-sync", { pageId, elements: page?.elements || [] });
    } catch (err) {
      console.error("Whiteboard redo error:", err.message);
    }
  });

  // Clear board stays teacher-only regardless of the student-annotation
  // toggle — it's a board-wide control, not a drawing action. Only wipes
  // the specified page; other pages on the same board are untouched.
  socket.on("clear-board", async (payload) => {
    const roomId = payload?.roomId;
    const pageId = payload?.pageId;
    if (!roomId || !pageId) return;
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
      await getOrInitBoard(roomId);
      await Whiteboard.updateOne(
        { session: roomId, "pages.pageId": pageId },
        { $set: { "pages.$.elements": [] } },
      );
    } catch (err) {
      console.error("Whiteboard clear error:", err.message);
    }

    registry.clearRedo(roomId, pageId);
    io.to(roomId).emit("page-sync", { pageId, elements: [] });
  });

  // Teacher-only: add a new blank page to this session's board. Broadcast
  // to the whole room (including the teacher) so every client's tab strip
  // stays in sync.
  socket.on("add-page", async (payload) => {
    const roomId = payload?.roomId;
    if (!roomId) return;
    if (
      !requireTeacher(
        roomId,
        "whiteboard-add-page",
        "Only the host can add a page.",
      )
    ) {
      return;
    }

    try {
      const board = await getOrInitBoard(roomId);
      const pageId = `page-${Date.now()}`;
      const name = payload?.name?.trim() || `Page ${board.pages.length + 1}`;

      await Whiteboard.updateOne(
        { session: roomId },
        { $push: { pages: { pageId, name, elements: [] } } },
      );

      // A newly-added page is what the host is teaching on now — students
      // should follow it too, including ones who join later.
      registry.setActivePage(roomId, pageId);
      io.to(roomId).emit("page-added", { pageId, name, elements: [] });
    } catch (err) {
      console.error("Whiteboard add-page error:", err.message);
    }
  });

  // Teacher-only: remove a page. A board must always keep at least one
  // page, so deleting the last remaining one is rejected instead.
  socket.on("delete-page", async (payload) => {
    const roomId = payload?.roomId;
    const pageId = payload?.pageId;
    if (!roomId || !pageId) return;
    if (
      !requireTeacher(
        roomId,
        "whiteboard-delete-page",
        "Only the host can delete a page.",
      )
    ) {
      return;
    }

    try {
      const board = await getOrInitBoard(roomId);
      if (board.pages.length <= 1) {
        socket.emit("action-denied", {
          action: "whiteboard-delete-page",
          message: "A board must have at least one page.",
        });
        return;
      }

      await Whiteboard.updateOne(
        { session: roomId },
        { $pull: { pages: { pageId } } },
      );

      registry.clearRedo(roomId, pageId);

      // If the page we just deleted was the one everyone was following,
      // fall back to whatever's now first so a late joiner still lands
      // somewhere valid.
      if (registry.getActivePage(roomId) === pageId) {
        const remaining = board.pages.filter((p) => p.pageId !== pageId);
        registry.setActivePage(roomId, remaining[0]?.pageId || null);
      }

      io.to(roomId).emit("page-deleted", { pageId });
    } catch (err) {
      console.error("Whiteboard delete-page error:", err.message);
    }
  });

  // Teacher-only: the host switched to a different (existing) page.
  // Students don't get a tab strip of their own — their canvas always
  // follows whichever page the host is currently on, so this is the event
  // that keeps it in sync in real time.
  socket.on("switch-page", (payload) => {
    const roomId = payload?.roomId;
    const pageId = payload?.pageId;
    if (!roomId || !pageId) return;
    if (
      !requireTeacher(
        roomId,
        "whiteboard-switch-page",
        "Only the host can switch pages.",
      )
    ) {
      return;
    }

    registry.setActivePage(roomId, pageId);
    socket.to(roomId).emit("active-page-changed", { pageId });
  });

  // Teacher-only: drag-and-drop reorder of the page tabs. `pageIds` is the
  // full new order (every existing page id, once each) — persisted so the
  // order survives a refresh/reconnect, not just a live broadcast.
  socket.on("reorder-pages", async (payload) => {
    const roomId = payload?.roomId;
    const pageIds = payload?.pageIds;
    if (!roomId || !Array.isArray(pageIds) || !pageIds.length) return;
    if (
      !requireTeacher(
        roomId,
        "whiteboard-reorder-pages",
        "Only the host can reorder pages.",
      )
    ) {
      return;
    }

    try {
      const board = await getOrInitBoard(roomId);
      const byId = new Map(board.pages.map((p) => [p.pageId, p]));

      // Rebuild in the requested order, but only using pages that actually
      // exist — never trust the client's list wholesale. Anything that
      // exists on the board but was missing from the payload (e.g. a page
      // added by a racing "add-page" the client hadn't seen yet) is kept,
      // appended at the end, so a reorder can never silently drop a page.
      const reordered = pageIds.map((id) => byId.get(id)).filter(Boolean);
      const seen = new Set(reordered.map((p) => p.pageId));
      board.pages.forEach((p) => {
        if (!seen.has(p.pageId)) reordered.push(p);
      });

      board.pages = reordered;
      await board.save();

      io.to(roomId).emit("pages-reordered", {
        pageIds: reordered.map((p) => p.pageId),
      });
    } catch (err) {
      console.error("Whiteboard reorder-pages error:", err.message);
    }
  });

  // Teacher-only: flip whether students may currently draw. Broadcast to
  // the whole room (including the teacher) so every client's toolbar
  // reflects the same state. Applies board-wide, not per-page.
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
  // Returns every page (client keeps them all in memory so switching tabs
  // is a local operation, no further round-trips) plus the current
  // student-annotation permission so a reconnecting/late-joining client's
  // toolbar starts in the right state.
  //
  // This re-verifies session membership itself (rather than trusting the
  // room registry) because the client fires this immediately after
  // "join-room", and "join-room" now does its own async authorization
  // check — relying on registry state here could race ahead of it. It's
  // also just the correct gate on its own: nobody outside this session's
  // classroom should be able to read its whiteboard state at all.
  socket.on("request-board-sync", async (payload) => {
    const roomId = typeof payload === "string" ? payload : payload?.roomId;
    if (!roomId) return;

    try {
      await getAuthorizedSession(roomId, socket.user);
    } catch (err) {
      socket.emit("board-sync", {
        pages: [],
        activePageId: null,
        allowStudentDraw: false,
      });
      return;
    }

    try {
      const board = await getOrInitBoard(roomId);
      // No host has switched pages yet this server run (or the process
      // just restarted) — fall back to the first page rather than leaving
      // a late joiner with nothing active.
      const activePageId = registry.getActivePage(roomId) || board.pages[0]?.pageId || null;
      socket.emit("board-sync", {
        pages: board.pages,
        activePageId,
        ...currentPermissionPayload(roomId),
      });
    } catch (err) {
      console.error("Whiteboard sync error:", err.message);
      socket.emit("board-sync", {
        pages: [],
        activePageId: null,
        ...currentPermissionPayload(roomId),
      });
    }
  });
};
