const Chat = require("./chat.model");

module.exports = (io, socket) => {
  socket.on("send-message", async (data) => {
    try {
      const message = await Chat.create({
        session: data.sessionId,
        sender: data.senderId,
        message: data.message,
      });

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
};
