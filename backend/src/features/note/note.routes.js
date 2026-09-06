const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const noteController = require("./note.controller");

router.use(authMiddleware);

router.get("/", noteController.getNotes);

router.post("/", noteController.createNote);

router.patch("/:id", noteController.updateNote);

router.delete("/:id", noteController.deleteNote);

module.exports = router;
