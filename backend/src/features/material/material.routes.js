const express = require("express");

const router = express.Router();

const auth = require("../../middleware/auth.middleware");
const teacherOnly = require("../../middleware/role.middleware");
const upload = require("../../middleware/upload.middleware");

const materialController = require("./material.controller");

router.post(
  "/",
  auth,
  teacherOnly("teacher"),
  upload.single("file"),
  materialController.uploadMaterial,
);

router.get("/classroom/:classroomId", auth, materialController.getMaterials);

router.delete(
  "/:id",
  auth,
  teacherOnly("teacher"),
  materialController.deleteMaterial,
);

module.exports = router;
