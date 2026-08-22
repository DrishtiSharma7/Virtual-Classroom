const Session = require("./session.model");

class SessionAccessError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function getAuthorizedSession(sessionId, user) {
  if (!sessionId || !user?.id) {
    throw new SessionAccessError("Invalid session or user", 400);
  }

  const session = await Session.findById(sessionId).populate("classroom");
  if (!session || !session.classroom) {
    throw new SessionAccessError("Session not found", 404);
  }

  const classroom = session.classroom;
  const isHost = classroom.teacher.toString() === user.id;
  const isMember =
    isHost || classroom.students.some((s) => s.toString() === user.id);

  if (!isMember) {
    throw new SessionAccessError(
      "You are not authorized to access this session",
      403,
    );
  }

  return { session, classroom, isHost };
}

module.exports = { getAuthorizedSession, SessionAccessError };
