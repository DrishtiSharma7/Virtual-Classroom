const mongoose = require("mongoose");

const recordingSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

recordingSchema.index({ classroom: 1, createdAt: -1 });

module.exports = mongoose.model("Recording", recordingSchema);
