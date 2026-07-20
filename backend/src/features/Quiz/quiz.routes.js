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

router.delete(
  "/:id",
  auth,
  roleMiddleware("teacher"),
  quizController.deleteQuiz,
);

module.exports = router;
