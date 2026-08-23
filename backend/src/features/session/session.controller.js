const Session = require("./session.model");
const Classroom = require("../classroom/classroom.model");
const Chat = require("../chat/chat.model");
const attendanceService = require("../attendance/attendance.service");
const sessionLifecycle = require("../../sockets/sessionLifecycle");

exports.createSession = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.body.classroom);

    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found",
      });
    }

    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const session = await Session.create({
      classroom: req.body.classroom,

      title: req.body.title,

      description: req.body.description,

      startTime: req.body.startTime,

      endTime: req.body.endTime,

      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Session created",

      session,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getSessionsByClassroom = async (req, res) => {
  try {
    const sessions = await Session.find({
      classroom: req.params.classroomId,
    })

      .populate(
        "createdBy",

        "name email",
      )

      .sort({
        startTime: 1,
      });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)

      .populate(
        "createdBy",

        "name email",
      )

      .populate(
        "classroom",

        "name subject",
      );

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (session.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await session.deleteOne();

    res.json({
      message: "Session deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.startSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (session.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    session.status = "live";
    session.startTime = new Date();

    await session.save();

    res.json({
      message: "Session started",
      session,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (session.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    session.status = "ended";
    session.endTime = new Date();

    await session.save();

    await attendanceService.completeSessionAttendance(session._id);

    await Chat.deleteMany({ session: session._id });

    sessionLifecycle.cancelAutoEnd(session._id.toString());

    const io = req.app.get("io");
    io?.to(session._id.toString()).emit("session-ended", {
      message: "This session has been ended by the host.",
    });

    res.json({
      message: "Session ended",
      session,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
