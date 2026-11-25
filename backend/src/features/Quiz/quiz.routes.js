const express = require("express");

const router = express.Router();
const auth = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const {
  cacheMiddleware,
  invalidateOnSuccess,
} = require("../../middleware/cache.middleware");
const quizController = require("./quiz.controller");

const quizInvalidation = invalidateOnSuccess([
  "quizzes",
  "analytics",
  "dashboard",
]);

router.post(
  "/",
  auth,
  roleMiddleware("teacher"),
  quizInvalidation,
  quizController.createQuiz,
);

router.post(
  "/submit/:id",
  auth,
  roleMiddleware("student"),
  quizInvalidation,
  quizController.submitQuiz,
);

router.get(
  "/results/:id",
  auth,
  roleMiddleware("teacher"),
  quizController.getResults,
);

router.get(
  "/classroom/:classroomId",
  auth,
  cacheMiddleware({ ttl: 30, prefix: "quizzes" }),
  quizController.getClassroomQuizzes,
);

router.get("/:id/detail", auth, quizController.getQuizDetail);

router.patch(
  "/:id/retake",
  auth,
  roleMiddleware("teacher"),
  quizInvalidation,
  quizController.toggleRetake,
);

router.delete(
  "/:id",
  auth,
  roleMiddleware("teacher"),
  quizInvalidation,
  quizController.deleteQuiz,
);

module.exports = router;
