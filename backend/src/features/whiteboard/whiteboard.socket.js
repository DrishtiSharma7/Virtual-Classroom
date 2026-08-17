const registry = require("../../sockets/roomRegistry");
const Whiteboard = require("./whiteboard.model");

module.exports = (io, socket) => {
  const requireTeacher = (roomId) => {
    if (registry.isTeacher(roomId, socket.id)) return true;

    socket.emit("action-denied", {
      action: "whiteboard-draw",
      message: "Only the host can draw on the whiteboard.",
    });
    return false;
  };

  socket.on("draw", async (data) => {
    if (!data?.roomId || !requireTeacher(data.roomId)) return;

    if (data.element) {
      try {
        await Whiteboard.findOneAndUpdate(
          { session: data.roomId },
          { $push: { elements: data.element } },
          { upsert: true, setDefaultsOnInsert: true },
        );
      } catch (err) {
        console.log("Whiteboard persist error:", err.message);
      }
    }

    socket.to(data.roomId).emit("draw", data);
  });

  socket.on("erase", (data) => {
    if (!data?.roomId || !requireTeacher(data.roomId)) return;
    socket.to(data.roomId).emit("erase", data);
  });

  socket.on("clear-board", async (payload) => {
    const roomId = typeof payload === "string" ? payload : payload?.roomId;
    if (!roomId || !requireTeacher(roomId)) return;

    try {
      await Whiteboard.findOneAndUpdate(
        { session: roomId },
        { $set: { elements: [] } },
        { upsert: true },
      );
    } catch (err) {
      console.log("Whiteboard clear error:", err.message);
    }

    io.to(roomId).emit("clear-board");
  });

  // Reconnect / late-join: read straight from the DB, so a dropped
  // connection, page refresh, or even a fresh server instance all
  // return the same board — not whatever happened to still be in memory.
  socket.on("request-board-sync", async (roomId) => {
    if (!roomId) return;

    try {
      const board = await Whiteboard.findOne({ session: roomId });
      socket.emit("board-sync", { elements: board?.elements || [] });
    } catch (err) {
      console.log("Whiteboard sync error:", err.message);
      socket.emit("board-sync", { elements: [] });
    }
  });
};
