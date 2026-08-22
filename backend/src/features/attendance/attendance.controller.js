const attendanceService = require("./attendance.service");

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

exports.getClassroomAttendance = async (req, res) => {
  try {
    const attendance = await attendanceService.getClassroomAttendance(
      req.params.classroomId,
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

exports.getAttendanceDashboard = async (req, res) => {
  try {
    const attendance = await attendanceService.getAttendanceDashboard(
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

exports.getLiveSessionAttendance = async (req, res) => {
  try {
    const attendance = await attendanceService.getLiveSessionAttendance(
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
