const express = require("express");

const router = express.Router();

const auth = require("../../middleware/auth.middleware");
const {
  cacheMiddleware,
  invalidateOnSuccess,
} = require("../../middleware/cache.middleware");

const {
  createSession,
  getSessionsByClassroom,
  getSessionById,
  deleteSession,
  startSession,
  endSession,
} = require("./session.controller");

const sessionInvalidation = invalidateOnSuccess([
  "dashboard",
  "analytics",
  "sessions",
]);

router.post("/", auth, sessionInvalidation, createSession);

router.get(
  "/classroom/:classroomId",
  auth,
  cacheMiddleware({ ttl: 15, prefix: "sessions" }),
  getSessionsByClassroom,
);

router.get("/:id", auth, getSessionById);

router.patch("/:id/start", auth, sessionInvalidation, startSession);

router.patch("/:id/end", auth, sessionInvalidation, endSession);

router.delete("/:id", auth, sessionInvalidation, deleteSession);

module.exports = router;
