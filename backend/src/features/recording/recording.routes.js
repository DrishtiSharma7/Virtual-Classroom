const express = require("express");

const router = express.Router();

const auth = require("../../middleware/auth.middleware");
const teacherOnly = require("../../middleware/role.middleware");
const upload = require("../../middleware/upload.middleware");

const recordingController = require("./recording.controller");

router.post(
  "/",
  auth,
  teacherOnly("teacher"),
  upload.single("file"),
  recordingController.uploadRecording,
);

router.get("/classroom/:classroomId", auth, recordingController.getRecordings);

router.delete(
  "/:id",
  auth,
  teacherOnly("teacher"),
  recordingController.deleteRecording,
);

module.exports = router;
