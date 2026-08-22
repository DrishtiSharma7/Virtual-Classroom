const Chat = require("./chat.model");

module.exports = (io, socket) => {
  socket.on("send-message", async (data) => {
    try {
      const message = await Chat.create({
        session: data.sessionId,
        sender: data.senderId,
        message: data.message,
      });

      await message.populate("sender", "name email");

      console.log("Message Saved :", message.message);

      io.to(data.sessionId).emit("receive-message", message);
    } catch (err) {
      console.log("Chat Error :", err.message);
    }
  });

  socket.on("typing", (roomId) => {
    socket.to(roomId).emit("user-typing");
  });

  socket.on("stop-typing", (roomId) => {
    socket.to(roomId).emit("user-stop-typing");
  });

  socket.on("send-reaction", ({ roomId, reactionId } = {}) => {
    if (!roomId) return;
    if (!REACTION_IDS.has(reactionId)) return;

    socket.to(roomId).emit("receive-reaction", {
      reactionId,
      from: socket.user?.name || "Someone",
    });
  });
};

const REACTION_IDS = new Set([
  "got-it",
  "confused",
  "raise-hand",
  "slow-down",
]);
