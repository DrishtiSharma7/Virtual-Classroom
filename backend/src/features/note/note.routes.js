const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const noteController = require("./note.controller");

// All note routes require authentication
router.use(authMiddleware);

// GET /api/notes - fetch all notes for logged-in user (important first, then recent)
router.get("/", noteController.getNotes);

// POST /api/notes - create new note
router.post("/", noteController.createNote);

// PATCH /api/notes/:id - update note text, important flag, or completed status
router.patch("/:id", noteController.updateNote);

// DELETE /api/notes/:id - delete a note
router.delete("/:id", noteController.deleteNote);

module.exports = router;
