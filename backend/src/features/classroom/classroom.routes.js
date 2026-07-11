const express = require("express");
const router = express.Router();
const classroomController = require("./classroom.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");

router.post(
  "/",
  authMiddleware,
  roleMiddleware("teacher"),
  classroomController.createClassroom,
);

router.post(
  "/join/:id",
  authMiddleware,
  roleMiddleware("student"),
  classroomController.joinClassroom,
);

router.get("/my", authMiddleware, classroomController.getMyClassrooms);

router.get("/:id", authMiddleware, classroomController.getClassroomById);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  classroomController.deleteClassroom,
);

module.exports = router;
