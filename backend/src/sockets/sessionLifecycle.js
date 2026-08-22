const Session = require("../features/session/session.model");
const Chat = require("../features/chat/chat.model");
const attendanceService = require("../features/attendance/attendance.service");

const TEACHER_INACTIVITY_TIMEOUT_MS =
  Number(process.env.TEACHER_INACTIVITY_TIMEOUT_MS) || 20 * 60 * 1000;

const pendingAutoEnds = new Map();

function scheduleAutoEnd(sessionId, io) {
  cancelAutoEnd(sessionId);

  const handle = setTimeout(async () => {
    pendingAutoEnds.delete(sessionId);
    try {
      const session = await Session.findById(sessionId);
      if (!session || session.status !== "live") return;

      session.status = "ended";
      session.endTime = new Date();
      await session.save();

      await attendanceService.completeSessionAttendance(session._id);
      await Chat.deleteMany({ session: session._id });

      io?.to(String(sessionId)).emit("session-ended", {
        message: "This session has ended due to host inactivity.",
      });
    } catch (err) {
      console.error("Auto-end session error:", err.message);
    }
  }, TEACHER_INACTIVITY_TIMEOUT_MS);

  pendingAutoEnds.set(sessionId, handle);
}

function cancelAutoEnd(sessionId) {
  const handle = pendingAutoEnds.get(sessionId);
  if (handle) {
    clearTimeout(handle);
    pendingAutoEnds.delete(sessionId);
  }
}

module.exports = { scheduleAutoEnd, cancelAutoEnd };
