const express = require("express");
const router = express.Router();

const assignmentController = require("./assignment.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");

router.post(
  "/",
  authMiddleware,
  roleMiddleware("teacher"),
  assignmentController.createAssignment,
);

router.get(
  "/classroom/:classroomId",
  authMiddleware,
  assignmentController.getAssignmentsByClassroom,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  assignmentController.deleteAssignment,
);

module.exports = router;
