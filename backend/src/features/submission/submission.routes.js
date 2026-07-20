const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const submissionController = require("./submission.controller");

router.post(
  "/",
  authMiddleware,
  roleMiddleware("student"),
  submissionController.submitAssignment,
);

router.get(
  "/assignment/:assignmentId",
  authMiddleware,
  roleMiddleware("teacher"),
  submissionController.getSubmissions,
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  submissionController.giveMarks,
);

module.exports = router;
