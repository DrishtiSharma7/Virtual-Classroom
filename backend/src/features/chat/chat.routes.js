const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth.middleware");
const chatController = require("./chat.controller");

router.get("/session/:sessionId", auth, chatController.getMessagesBySession);

router.delete("/:id", auth, chatController.deleteMessage);

module.exports = router;
