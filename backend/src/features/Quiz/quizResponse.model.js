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
  },

  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "QuizResponse",

  quizResponseSchema,
);
