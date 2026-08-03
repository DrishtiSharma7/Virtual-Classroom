const mongoose = require("mongoose");

const quizResponseSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    answers: [Number],

    score: {
      type: Number,
      default: 0,
    },

    // "live"   -> submitted during the teacher's live-launched session (via socket flow)
    // "retake" -> submitted afterwards, self-attempted from the Quiz page
    // once the teacher has opened the quiz for retake.
    source: {
      type: String,
      enum: ["live", "retake"],
      default: "live",
    },
  },

  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "QuizResponse",

  quizResponseSchema,
);
