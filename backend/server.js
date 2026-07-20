require("dotenv").config();

const app = require("./src/app");
const mongoose = require("mongoose");

const http = require("http");
const { Server } = require("socket.io");

const socketHandler = require("./src/sockets/socket");

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

socketHandler(io);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("DB error:", err);
  });
