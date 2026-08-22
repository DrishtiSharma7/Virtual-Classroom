const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const attendanceController = require("./attendance.controller");

// Attendance join/leave are recorded automatically from the socket
// "join-room"/"leave-room"/"disconnect" events (see sockets/socket.js) —
// there is deliberately no client-callable join/leave endpoint here.

// Teacher ends session
router.put(
  "/complete/:sessionId",
  auth,
  roleMiddleware("teacher"),
  attendanceController.completeSession,
);

// Teacher views attendance
router.get(
  "/session/:sessionId",
  auth,
  roleMiddleware("teacher"),
  attendanceController.getSessionAttendance,
);

// Student views own attendance
router.get(
  "/me",
  auth,
  roleMiddleware("student"),
  attendanceController.getMyAttendance,
);

// Teacher views attendance dashboard across all their classrooms
router.get(
  "/dashboard",
  auth,
  roleMiddleware("teacher"),
  attendanceController.getAttendanceDashboard,
);

// Teacher views attendance dashboard for one classroom
router.get(
  "/classroom/:classroomId",
  auth,
  roleMiddleware("teacher"),
  attendanceController.getClassroomAttendance,
);

// Teacher views live (in-progress) attendance for a session
router.get(
  "/session/:sessionId/live",
  auth,
  roleMiddleware("teacher"),
  attendanceController.getLiveSessionAttendance,
);

module.exports = router;
