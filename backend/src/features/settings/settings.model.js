const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Shared session preferences (Teacher + Student) — Live Session (Video & Audio)
    session: {
      joinWithCameraOn: {
        type: Boolean,
        default: true,
      },
      joinWithMicOn: {
        type: Boolean,
        default: false,
      },
    },

    // Teacher-only preferences
    teacher: {
      // Digital Whiteboard defaults
      defaultPenColor: {
        type: String,
        default: "#1e293b",
      },
      defaultStrokeSize: {
        type: Number,
        default: 3,
        min: 1,
        max: 20,
      },
      // Live Quiz defaults
      defaultQuizTimeLimit: {
        type: Number,
        default: 60,
        min: 30,
        max: 120,
      },
      // Classroom control
      autoMuteStudentsOnJoin: {
        type: Boolean,
        default: false,
      },
      allowStudentVideoByDefault: {
        type: Boolean,
        default: true,
      },
    },

    // Student-only preferences
    student: {
      preferredSessionView: {
        type: String,
        enum: ["speaker", "grid"],
        default: "speaker",
      },
      showQuizResultImmediately: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Settings", settingsSchema);