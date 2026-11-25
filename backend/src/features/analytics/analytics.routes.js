const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const { cacheMiddleware } = require("../../middleware/cache.middleware");
const analyticsController = require("./analytics.controller");

const analyticsCache = cacheMiddleware({ ttl: 60, prefix: "analytics" });

router.get(
  "/overview",
  auth,
  roleMiddleware("teacher"),
  analyticsCache,
  analyticsController.getOverview,
);

router.get(
  "/attendance",
  auth,
  roleMiddleware("teacher"),
  analyticsCache,
  analyticsController.getAttendanceAnalytics,
);

router.get(
  "/sessions",
  auth,
  roleMiddleware("teacher"),
  analyticsCache,
  analyticsController.getSessionAnalytics,
);

router.get(
  "/quizzes",
  auth,
  roleMiddleware("teacher"),
  analyticsCache,
  analyticsController.getQuizAnalytics,
);

router.get(
  "/classes",
  auth,
  roleMiddleware("teacher"),
  analyticsCache,
  analyticsController.getClassComparison,
);

router.get(
  "/me",
  auth,
  roleMiddleware("student"),
  analyticsCache,
  analyticsController.getMyAnalytics,
);

router.get(
  "/students/:studentId",
  auth,
  roleMiddleware("teacher"),
  analyticsCache,
  analyticsController.getStudentDetail,
);

module.exports = router;
