const jwt = require("jsonwebtoken");

// Socket.IO auth middleware. The frontend already connects with
// `io(url, { auth: { token } })` — this verifies that token the same way
// the REST auth.middleware does, and attaches the decoded payload
// ({ id, name, role }) to socket.user so every event handler downstream
// can trust socket.user instead of whatever the client claims in payloads.
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
