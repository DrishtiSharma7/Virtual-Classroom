const Session = require("./session.model");
const Classroom = require("../classroom/classroom.model");

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

// GET ALL SESSIONS OF CLASSROOM

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

// GET SESSION BY ID

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

// DELETE SESSION

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
