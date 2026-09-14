const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
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

materialSchema.index({ classroom: 1, createdAt: -1 });

module.exports = mongoose.model("Material", materialSchema);
