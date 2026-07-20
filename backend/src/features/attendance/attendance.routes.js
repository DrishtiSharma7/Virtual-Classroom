const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const attendanceController = require("./attendance.controller");

// Student joins live session
router.post(
  "/join",
  auth,
  roleMiddleware("student"),
  attendanceController.joinSession,
);

// Student leaves live session
router.post(
  "/leave",
  auth,
  roleMiddleware("student"),
  attendanceController.leaveSession,
);

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

module.exports = router;
