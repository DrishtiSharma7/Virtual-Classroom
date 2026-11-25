const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
    },
  },

  {
    timestamps: true,
  },
);

chatSchema.index({ session: 1, createdAt: 1 });
chatSchema.index({ sender: 1 });

module.exports = mongoose.model(
  "Chat",

  chatSchema,
);
