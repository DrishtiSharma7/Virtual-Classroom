const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const announcementController = require("./announcement.controller");

router.post(
  "/",
  authMiddleware,
  roleMiddleware("teacher"),
  announcementController.createAnnouncement,
);

router.get(
  "/classroom/:classroomId",
  authMiddleware,
  announcementController.getAnnouncements,
);

module.exports = router;
