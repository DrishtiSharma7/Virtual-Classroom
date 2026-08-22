const jwt = require("jsonwebtoken");

module.exports = (socket, next) => {
  try {
    const raw = socket.handshake.auth?.token || socket.handshake.query?.token;

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
