const Note = require("./note.model");

exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id })
      .sort({ isImportant: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch notes",
    });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { text, isImportant } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note text is required",
      });
    }

    const note = await Note.create({
      user: req.user.id,
      text: text.trim(),
      isImportant: Boolean(isImportant),
      isCompleted: false,
    });

    res.status(201).json({
      success: true,
      message: "Note added successfully",
      note,
    });
  } catch (err) {
    console.error("Error creating note:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create note",
    });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, isImportant, isCompleted } = req.body;

    const note = await Note.findOne({ _id: id, user: req.user.id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or unauthorized",
      });
    }

    if (text !== undefined) {
      if (!text.trim()) {
        return res.status(400).json({
          success: false,
          message: "Note text cannot be empty",
        });
      }
      note.text = text.trim();
    }

    if (isImportant !== undefined) {
      note.isImportant = Boolean(isImportant);
    }

    if (isCompleted !== undefined) {
      note.isCompleted = Boolean(isCompleted);
    }

    await note.save();

    res.json({
      success: true,
      message: "Note updated successfully",
      note,
    });
  } catch (err) {
    console.error("Error updating note:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to update note",
    });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findOneAndDelete({ _id: id, user: req.user.id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or unauthorized",
      });
    }

    res.json({
      success: true,
      message: "Note deleted successfully",
      noteId: id,
    });
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to delete note",
    });
  }
};
