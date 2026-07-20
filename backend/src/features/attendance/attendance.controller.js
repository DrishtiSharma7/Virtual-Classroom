const Attendance = require("./attendance.model");
const attendanceService = require("./attendance.service");

// =========================================
// Student joins a live session
// =========================================
exports.joinSession = async (req, res) => {
  try {
    const { classroomId, sessionId } = req.body;

    const attendance = await attendanceService.studentJoined({
      classroomId,
      sessionId,
      studentId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Attendance started",
      attendance,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================================
// Student leaves a live session
// =========================================
exports.leaveSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const attendance = await attendanceService.studentLeft({
      sessionId,
      studentId: req.user.id,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found",
      });
    }

    res.json({
      success: true,
      message: "Attendance updated",
      attendance,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================================
// Teacher ends session
// =========================================
exports.completeSession = async (req, res) => {
  try {
    await attendanceService.completeSessionAttendance(req.params.sessionId);

    res.json({
      success: true,
      message: "Session attendance completed",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================================
// Teacher views attendance of session
// =========================================
exports.getSessionAttendance = async (req, res) => {
  try {
    const attendance = await attendanceService.getSessionAttendance(
      req.params.sessionId,
    );

    res.json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================================
// Student views own attendance
// =========================================
exports.getMyAttendance = async (req, res) => {
  try {
    const attendance = await attendanceService.getStudentAttendance(
      req.user.id,
    );

    res.json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
