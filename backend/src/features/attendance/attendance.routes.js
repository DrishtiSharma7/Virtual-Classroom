const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const attendanceController = require("./attendance.controller");

router.put(
  "/complete/:sessionId",
  auth,
  roleMiddleware("teacher"),
  attendanceController.completeSession,
);

router.get(
  "/session/:sessionId",
  auth,
  roleMiddleware("teacher"),
  attendanceController.getSessionAttendance,
);

router.get(
  "/me",
  auth,
  roleMiddleware("student"),
  attendanceController.getMyAttendance,
);

router.get(
  "/dashboard",
  auth,
  roleMiddleware("teacher"),
  attendanceController.getAttendanceDashboard,
);

router.get(
  "/classroom/:classroomId",
  auth,
  roleMiddleware("teacher"),
  attendanceController.getClassroomAttendance,
);

router.get(
  "/session/:sessionId/live",
  auth,
  roleMiddleware("teacher"),
  attendanceController.getLiveSessionAttendance,
);

module.exports = router;
