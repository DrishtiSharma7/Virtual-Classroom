const registry = require("../../sockets/roomRegistry");
const Whiteboard = require("./whiteboard.model");
const { getAuthorizedSession } = require("../session/session.service");
const { getOrInitBoard } = require("./whiteboard.service");

module.exports = (io, socket) => {
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
      registry.clearRedo(data.roomId, data.pageId);

      try {
        await getOrInitBoard(data.roomId);
        await Whiteboard.updateOne(
          { session: data.roomId, "pages.pageId": { $ne: data.pageId } },
          { $push: { pages: { pageId: data.pageId, name: "Page", elements: [] } } },
        );

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

    socket.to(data.roomId).emit("draw", data);
  });

  socket.on("draw-preview", (data) => {
    if (!data?.roomId || !data.element) return;
    if (!registry.canDraw(data.roomId, socket.id)) return;
    socket.to(data.roomId).emit("draw-preview", data);
  });

  socket.on("draw-preview-end", (data) => {
    if (!data?.roomId) return;
    socket.to(data.roomId).emit("draw-preview-end", data);
  });

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
    if (!restored)
      return;

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

      registry.setActivePage(roomId, pageId);
      io.to(roomId).emit("page-added", { pageId, name, elements: [] });
    } catch (err) {
      console.error("Whiteboard add-page error:", err.message);
    }
  });

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

      if (registry.getActivePage(roomId) === pageId) {
        const remaining = board.pages.filter((p) => p.pageId !== pageId);
        registry.setActivePage(roomId, remaining[0]?.pageId || null);
      }

      io.to(roomId).emit("page-deleted", { pageId });
    } catch (err) {
      console.error("Whiteboard delete-page error:", err.message);
    }
  });

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
