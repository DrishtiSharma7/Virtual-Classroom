const express = require("express");

const router = express.Router();

const auth = require("../../middleware/auth.middleware");

const {
  createSession,
  getSessionsByClassroom,
  getSessionById,
  deleteSession,
  startSession,
  endSession,
} = require("./session.controller");

router.post("/", auth, createSession);

router.get("/classroom/:classroomId", auth, getSessionsByClassroom);

router.get("/:id", auth, getSessionById);

router.patch("/:id/start", auth, startSession);

router.patch("/:id/end", auth, endSession);

router.delete("/:id", auth, deleteSession);

module.exports = router;
