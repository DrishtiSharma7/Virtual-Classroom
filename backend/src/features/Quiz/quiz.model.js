const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },

  options: [
    {
      type: String,
    },
  ],

  correctAnswer: {
    type: Number,
    required: true,
  },

  timeLimit: {
    type: Number,
    default: 60,
  },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "Untitled Quiz",
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    launched: {
      type: Boolean,
      default: false,
    },

    openForRetake: {
      type: Boolean,
      default: false,
    },

    questions: [questionSchema],
  },

  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Quiz", quizSchema);
