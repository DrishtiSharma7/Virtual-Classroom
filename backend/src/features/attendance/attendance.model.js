const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    joinTime: {
      type: Date,
      default: Date.now,
    },

    leaveTime: {
      type: Date,
    },

    duration: {
      type: Number,
      default: 0,
    },

    attendancePercentage: {
      type: Number,
      default: 0,
    },

    isPresent: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["IN_SESSION", "LEFT", "COMPLETED"],
      default: "IN_SESSION",
    },
  },
  {
    timestamps: true,
  },
);

attendanceSchema.index({
  session: 1,
  student: 1,
});

module.exports = mongoose.model("Attendance", attendanceSchema);
