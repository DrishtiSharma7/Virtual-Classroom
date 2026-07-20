module.exports = (io, socket) => {
  // User joined a call
  socket.on("join-call", (roomId) => {
    socket.join(roomId);

    socket.to(roomId).emit("user-joined", {
      socketId: socket.id,
    });

    console.log(socket.id, "joined call", roomId);
  });

  // Offer
  socket.on("offer", (data) => {
    socket.to(data.roomId).emit("offer", {
      offer: data.offer,
      sender: socket.id,
    });
  });

  // Answer
  socket.on("answer", (data) => {
    socket.to(data.roomId).emit("answer", {
      answer: data.answer,
      sender: socket.id,
    });
  });

  // ICE Candidate
  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit("ice-candidate", {
      candidate: data.candidate,
      sender: socket.id,
    });
  });

  // Leave Call
  socket.on("leave-call", (roomId) => {
    socket.leave(roomId);

    socket.to(roomId).emit("user-left", {
      socketId: socket.id,
    });

    console.log(socket.id, "left call", roomId);
  });
};
