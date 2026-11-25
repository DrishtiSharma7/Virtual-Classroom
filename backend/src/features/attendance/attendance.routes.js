const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const {
  cacheMiddleware,
  invalidateOnSuccess,
} = require("../../middleware/cache.middleware");
const attendanceController = require("./attendance.controller");

const attendanceCache = cacheMiddleware({ ttl: 30, prefix: "attendance" });
const attendanceInvalidation = invalidateOnSuccess([
  "attendance",
  "dashboard",
  "analytics",
]);

router.put(
  "/complete/:sessionId",
  auth,
  roleMiddleware("teacher"),
  attendanceInvalidation,
  attendanceController.completeSession,
);

router.get(
  "/session/:sessionId",
  auth,
  roleMiddleware("teacher"),
  attendanceCache,
  attendanceController.getSessionAttendance,
);

router.get(
  "/me",
  auth,
  roleMiddleware("student"),
  attendanceCache,
  attendanceController.getMyAttendance,
);

router.get(
  "/dashboard",
  auth,
  roleMiddleware("teacher"),
  attendanceCache,
  attendanceController.getAttendanceDashboard,
);

router.get(
  "/classroom/:classroomId",
  auth,
  roleMiddleware("teacher"),
  attendanceCache,
  attendanceController.getClassroomAttendance,
);

// Kept completely uncached for real-time live attendance tracking
router.get(
  "/session/:sessionId/live",
  auth,
  roleMiddleware("teacher"),
  attendanceController.getLiveSessionAttendance,
);

module.exports = router;
