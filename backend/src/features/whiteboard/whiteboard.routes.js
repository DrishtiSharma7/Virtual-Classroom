const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth.middleware");
const whiteboardController = require("./whiteboard.controller");

router.get(
  "/session/:sessionId",
  auth,
  whiteboardController.getBoardBySession
);

module.exports = router;