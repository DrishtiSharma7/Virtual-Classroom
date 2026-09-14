const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
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

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

announcementSchema.index({ classroom: 1, createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);
