const Chat = require("./chat.model");

module.exports = (io, socket) => {
  socket.on("send-message", async (data) => {
    try {
      const message = await Chat.create({
        session: data.sessionId,
        sender: data.senderId,
        message: data.message,
      });

      // The REST history endpoint (getMessagesBySession) populates `sender`
      // with the user's name/email — a freshly-created doc doesn't have
      // that yet, so without this a live message would show as
      // "Participant" (the frontend's fallback for a missing sender.name)
      // until the page was refreshed and the populated history reloaded.
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

  // Student quick-feedback reactions (the "Feedback" button). Ephemeral —
  // not persisted anywhere, just relayed live, same as typing above.
  // reactionId is checked against a fixed set rather than trusting
  // whatever the client sends, and the sender's name comes from
  // socket.user (set by the auth middleware from the verified JWT), never
  // the payload — a modified client can't spoof either. The actual
  // icon/label for a given reactionId is a frontend-only concern (lucide
  // icons aren't something a socket payload can carry) — this only needs
  // to validate and relay the id itself.
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
