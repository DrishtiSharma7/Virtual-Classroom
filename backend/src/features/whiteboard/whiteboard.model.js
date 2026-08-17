const mongoose = require("mongoose");

const whiteboardSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      unique: true,
    },

    elements: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Whiteboard", whiteboardSchema);