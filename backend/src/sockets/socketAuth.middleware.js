const jwt = require("jsonwebtoken");
const { parseCookies } = require("../utils/cookie");

module.exports = (socket, next) => {
  try {
    let raw = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!raw && socket.handshake.headers?.cookie) {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      raw = cookies.token;
    }

    if (!raw) {
      return next(new Error("Authentication required"));
    }

    const token = raw.startsWith("Bearer ") ? raw.split(" ")[1] : raw;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch (err) {
    next(new Error("Invalid or expired token"));
  }
};
