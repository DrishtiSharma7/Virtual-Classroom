const express = require("express");
const router = express.Router();

const settingsController = require("./settings.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");

router.get("/", authMiddleware, settingsController.getSettings);

router.put("/profile", authMiddleware, settingsController.updateProfile);
router.put("/password", authMiddleware, settingsController.changePassword);
router.put("/session", authMiddleware, settingsController.updateSessionSettings);

router.put(
  "/teacher",
  authMiddleware,
  roleMiddleware("teacher"),
  settingsController.updateTeacherSettings,
);

router.put(
  "/student",
  authMiddleware,
  roleMiddleware("student"),
  settingsController.updateStudentSettings,
);

module.exports = router;