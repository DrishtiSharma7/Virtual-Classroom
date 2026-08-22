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

router.get("/classroom/:classroomId", auth, quizController.getClassroomQuizzes);

router.get("/:id/detail", auth, quizController.getQuizDetail);

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
