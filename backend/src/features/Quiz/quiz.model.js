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

    // Denormalized from session.classroom at creation time so quizzes can be
    // listed for a classroom (e.g. on the Quiz page) without an extra lookup.
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

    // Becomes true the first time this quiz is shown to students at all —
    // either launched live in a session, or manually reopened by the teacher
    // for retake afterwards. Until then it's hidden from the student Quiz
    // page entirely (teacher can still see/edit/launch it).
    launched: {
      type: Boolean,
      default: false,
    },

    // When true, students can attempt this quiz themselves from the Quiz
    // page (outside of a live session) via a normal REST submit. Teacher
    // toggles this on/off after the live session, from the Quiz page.
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
