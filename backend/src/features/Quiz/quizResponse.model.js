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

quizResponseSchema.index({ quiz: 1, student: 1, source: 1 });
quizResponseSchema.index({ quiz: 1 });
quizResponseSchema.index({ student: 1 });

module.exports = mongoose.model(
  "QuizResponse",

  quizResponseSchema,
);
