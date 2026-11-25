const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    sessionTitle: {
      type: String,
      default: "",
    },

    code: {
      type: String,
      required: true,
      unique: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

classroomSchema.index({ teacher: 1 });
classroomSchema.index({ students: 1 });

module.exports = mongoose.model("Classroom", classroomSchema);
