const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, "Note text is required"],
      trim: true,
      maxlength: [1000, "Note text cannot exceed 1000 characters"],
    },
    isImportant: {
      type: Boolean,
      default: false,
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast retrieval: user notes sorted by important first, then recently created
noteSchema.index({ user: 1, isImportant: -1, createdAt: -1 });

module.exports = mongoose.model("Note", noteSchema);
