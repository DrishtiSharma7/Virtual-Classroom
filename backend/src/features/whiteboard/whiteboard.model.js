const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      default: "Page 1",
    },

    elements: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { _id: false }
);

const whiteboardSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      unique: true,
    },

    pages: {
      type: [pageSchema],
      default: () => [{ pageId: "page-1", name: "Page 1", elements: [] }],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Whiteboard", whiteboardSchema);
