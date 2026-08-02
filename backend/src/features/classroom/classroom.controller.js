const Classroom = require("./classroom.model");

const generateRoomCode = async () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  let exists = true;
  while (exists) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    exists = await Classroom.findOne({ code });
  }
  return code;
};

exports.createClassroom = async (req, res) => {
  try {
    const { name, subject } = req.body;
    if (!name || !subject) {
      return res.status(400).json({
        message: "Name and Subject are required",
      });
    }
    const roomCode = await generateRoomCode();
    const classroom = await Classroom.create({
      name,
      subject,
      teacher: req.user.id,
      code: roomCode,
    });
    res.status(201).json({
      success: true,
      classroom,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.joinClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findOne({
      code: req.params.id.toUpperCase(),
    });
    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found",
      });
    }
    if (classroom.students.includes(req.user.id)) {
      return res.status(400).json({
        message: "Already joined",
      });
    }
    classroom.students.push(req.user.id);
    await classroom.save();
    res.json({
      message: "Joined classroom successfully",
      classroom,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getMyClassrooms = async (req, res) => {
  try {
    let classrooms;
    if (req.user.role === "teacher") {
      classrooms = await Classroom.find({
        teacher: req.user.id,
      });
    } else {
      classrooms = await Classroom.find({
        students: req.user.id,
      });
    }
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getClassroomById = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate("teacher", "name email")
      .populate("students", "name email");
    if (!classroom) {
      return res.status(404).json({
        message: "Classroom not found",
      });
    }
    res.json(classroom);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
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
    await classroom.deleteOne();
    res.json({
      message: "Classroom deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
