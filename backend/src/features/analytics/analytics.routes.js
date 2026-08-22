const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const analyticsController = require("./analytics.controller");

router.get(
  "/overview",
  auth,
  roleMiddleware("teacher"),
  analyticsController.getOverview,
);

router.get(
  "/attendance",
  auth,
  roleMiddleware("teacher"),
  analyticsController.getAttendanceAnalytics,
);

router.get(
  "/sessions",
  auth,
  roleMiddleware("teacher"),
  analyticsController.getSessionAnalytics,
);

router.get(
  "/quizzes",
  auth,
  roleMiddleware("teacher"),
  analyticsController.getQuizAnalytics,
);

router.get(
  "/classes",
  auth,
  roleMiddleware("teacher"),
  analyticsController.getClassComparison,
);

router.get(
  "/me",
  auth,
  roleMiddleware("student"),
  analyticsController.getMyAnalytics,
);

router.get(
  "/students/:studentId",
  auth,
  roleMiddleware("teacher"),
  analyticsController.getStudentDetail,
);

module.exports = router;
