const attendanceService = require("./attendance.service");

// Join/leave are no longer client-callable endpoints — attendance is
// recorded automatically as a side effect of the server-verified socket
// "join-room"/"leave-room"/"disconnect" events (see sockets/socket.js and
// attendance.service.js's recordConnect/recordDisconnect). This keeps
// attendance impossible for a student to self-report: there is no request
// they can send that writes an attendance record.

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

// =========================================
// Teacher views attendance dashboard for one classroom
// =========================================
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

// =========================================
// Teacher views attendance dashboard across all their classrooms
// =========================================
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

// =========================================
// Teacher views live (in-progress) attendance for a session
// =========================================
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
