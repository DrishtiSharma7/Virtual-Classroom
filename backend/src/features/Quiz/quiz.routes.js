const express = require("express");

const router = express.Router();
const auth = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const quizController = require("./quiz.controller");

router.post("/", auth, roleMiddleware("teacher"), quizController.createQuiz);

router.post(
  "/submit/:id",
  auth,
  roleMiddleware("student"),
  quizController.submitQuiz,
);

router.get(
  "/results/:id",
  auth,
  roleMiddleware("teacher"),
  quizController.getResults,
);

// Role-aware list of every quiz in a classroom (teacher: own quizzes +
// response counts, student: attempted/not-attempted + score).
router.get("/classroom/:classroomId", auth, quizController.getClassroomQuizzes);

// Role-aware single quiz view (teacher: full quiz w/ correct answers,
// student: their right/wrong breakdown, or the un-attempted questions).
router.get("/:id/detail", auth, quizController.getQuizDetail);

// Teacher opens/closes the quiz for students to self-attempt after the
// live session (also marks it launched/visible to students).
router.patch(
  "/:id/retake",
  auth,
  roleMiddleware("teacher"),
  quizController.toggleRetake,
);

router.delete(
  "/:id",
  auth,
  roleMiddleware("teacher"),
  quizController.deleteQuiz,
);

module.exports = router;
