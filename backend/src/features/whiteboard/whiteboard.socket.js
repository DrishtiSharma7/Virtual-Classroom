module.exports = (io, socket) => {
  socket.on("draw", (data) => {
    socket.to(data.roomId).emit("draw", data);
  });

  socket.on("erase", (data) => {
    socket.to(data.roomId).emit("erase", data);
  });

  socket.on("clear-board", (roomId) => {
    io.to(roomId).emit("clear-board");
  });
};
