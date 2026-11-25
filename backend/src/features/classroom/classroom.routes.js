const express = require("express");
const router = express.Router();
const classroomController = require("./classroom.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const {
  cacheMiddleware,
  invalidateOnSuccess,
} = require("../../middleware/cache.middleware");

const classroomInvalidation = invalidateOnSuccess([
  "classrooms",
  "dashboard",
  "analytics",
]);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("teacher"),
  classroomInvalidation,
  classroomController.createClassroom,
);

router.post(
  "/join/:id",
  authMiddleware,
  roleMiddleware("student"),
  classroomInvalidation,
  classroomController.joinClassroom,
);

router.get(
  "/my",
  authMiddleware,
  cacheMiddleware({ ttl: 60, prefix: "classrooms" }),
  classroomController.getMyClassrooms,
);

router.get("/:id", authMiddleware, classroomController.getClassroomById);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  classroomInvalidation,
  classroomController.updateClassroom,
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("teacher"),
  classroomInvalidation,
  classroomController.deleteClassroom,
);

module.exports = router;
