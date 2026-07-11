const express = require("express");

const router = express.Router();

const auth = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const sessionController = require("./session.controller");

router.post(
  "/",
  auth,
  roleMiddleware("teacher"),
  sessionController.createSession,
);

router.get(
  "/classroom/:classroomId",
  auth,
  sessionController.getSessionsByClassroom,
);

router.get("/:id", auth, sessionController.getSessionById);

router.delete(
  "/:id",
  auth,
  roleMiddleware("teacher"),
  sessionController.deleteSession,
);

module.exports = router;
