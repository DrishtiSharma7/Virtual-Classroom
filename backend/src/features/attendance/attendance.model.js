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

    // One entry per continuous connected stretch. disconnectedAt is null
    // while the student is currently connected (at most one open entry at
    // a time, per session+student). `duration` below is always the sum of
    // every closed entry's length — the single source of truth for how
    // long this student was actually present, resilient to any number of
    // disconnect/reconnects without ever needing to reset.
    connectedIntervals: [
      {
        connectedAt: { type: Date, required: true },
        disconnectedAt: { type: Date, default: null },
        _id: false,
      },
    ],

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
      enum: ["IN_SESSION", "COMPLETED"],
      default: "IN_SESSION",
    },
  },
  {
    timestamps: true,
  },
);

// unique: guarantees at most one attendance record per student per session
// even if two "connect" events race each other (e.g. two tabs opened at
// the same instant) — recordConnect relies on this via an upsert.
attendanceSchema.index(
  {
    session: 1,
    student: 1,
  },
  { unique: true },
);

module.exports = mongoose.model("Attendance", attendanceSchema);
