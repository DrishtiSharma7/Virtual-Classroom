const Quiz = require("./quiz.model");
const QuizResponse = require("./quizResponse.model");
const Session = require("../session/session.model");

exports.createQuiz = async (req, res) => {
  try {
    const session = await Session.findById(req.body.session);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    const quiz = await Quiz.create({
      title: req.body.title || "Untitled Quiz",
      session: req.body.session,
      classroom: session.classroom,
      createdBy: req.user.id,
      questions: req.body.questions,
    });

    res.status(201).json({
      message: "Quiz created",
      quiz,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================
// GET ALL QUIZZES FOR A CLASSROOM
// Teacher -> quizzes they created, with response counts.
// Student -> every quiz in the classroom, tagged as attempted
//            (with their score) or not-yet-attempted.
// ======================================
exports.getClassroomQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ classroom: req.params.classroomId })
      .populate("session", "title startTime status")
      .sort({ createdAt: -1 });

    if (req.user.role === "teacher") {
      const own = quizzes.filter((q) => q.createdBy.toString() === req.user.id);

      const withCounts = await Promise.all(
        own.map(async (q) => {
          const responseCount = await QuizResponse.countDocuments({
            quiz: q._id,
          });

          return {
            _id: q._id,
            title: q.title,
            session: q.session,
            questionCount: q.questions.length,
            responseCount,
            launched: q.launched,
            openForRetake: q.openForRetake,
            createdAt: q.createdAt,
          };
        }),
      );

      return res.json(withCounts);
    }

    // student role — only quizzes the teacher has actually launched at
    // least once (live, or reopened for retake) are visible at all.
    const visibleQuizzes = quizzes.filter((q) => q.launched);

    const myResponses = await QuizResponse.find({
      quiz: { $in: visibleQuizzes.map((q) => q._id) },
      student: req.user.id,
    }).sort({ createdAt: 1 });

    const responsesByQuiz = new Map();
    myResponses.forEach((r) => {
      const key = r.quiz.toString();
      if (!responsesByQuiz.has(key)) responsesByQuiz.set(key, []);
      responsesByQuiz.get(key).push(r);
    });

    const result = visibleQuizzes.map((q) => {
      const responses = responsesByQuiz.get(q._id.toString()) || [];
      const latest = responses[responses.length - 1];

      return {
        _id: q._id,
        title: q.title,
        session: q.session,
        questionCount: q.questions.length,
        createdAt: q.createdAt,
        openForRetake: q.openForRetake,
        attempted: responses.length > 0,
        score: latest ? latest.score : null,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================
// GET SINGLE QUIZ DETAIL
// Teacher (owner) -> full quiz incl. correct answers + response count.
// Student -> if attempted, per-question breakdown (their answer, correct
//            answer, right/wrong); if not attempted, questions without
//            correctAnswer / their status only.
// ======================================
exports.getQuizDetail = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate(
      "session",
      "title startTime status",
    );

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (req.user.role === "teacher") {
      if (quiz.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Not authorized",
        });
      }

      const responseCount = await QuizResponse.countDocuments({
        quiz: quiz._id,
      });

      return res.json({
        _id: quiz._id,
        title: quiz.title,
        session: quiz.session,
        questions: quiz.questions,
        responseCount,
        launched: quiz.launched,
        openForRetake: quiz.openForRetake,
        createdAt: quiz.createdAt,
      });
    }

    if (!quiz.launched) {
      return res.status(403).json({
        message: "This quiz hasn't been made available yet.",
      });
    }

    // student role — gather every attempt (live + retake), oldest first.
    const responses = await QuizResponse.find({
      quiz: quiz._id,
      student: req.user.id,
    }).sort({ createdAt: 1 });

    const attempts = responses.map((r) => ({
      source: r.source,
      score: r.score,
      submittedAt: r.createdAt,
    }));

    const latest = responses[responses.length - 1];

    if (!latest) {
      return res.json({
        _id: quiz._id,
        title: quiz.title,
        session: quiz.session,
        attempted: false,
        openForRetake: quiz.openForRetake,
        attempts: [],
        total: quiz.questions.length,
        questions: quiz.questions.map((q) => ({
          _id: q._id,
          question: q.question,
          options: q.options,
        })),
      });
    }

    const breakdown = quiz.questions.map((q, index) => {
      const selected = latest.answers[index];

      return {
        _id: q._id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer: selected === undefined ? -1 : selected,
        isCorrect: selected === q.correctAnswer,
      };
    });

    const attemptedLive = responses.some((r) => r.source === "live");
    const attemptedRetake = responses.some((r) => r.source === "retake");

    res.json({
      _id: quiz._id,
      title: quiz.title,
      session: quiz.session,
      attempted: true,
      openForRetake: quiz.openForRetake,
      attemptedLive,
      attemptedRetake,
      attempts,
      score: latest.score,
      total: quiz.questions.length,
      submittedAt: latest.createdAt,
      questions: breakdown,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const source = req.body.source === "retake" ? "retake" : "live";

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (source === "retake" && !quiz.openForRetake) {
      return res.status(403).json({
        message: "This quiz isn't open for retake right now.",
      });
    }

    const existing = await QuizResponse.findOne({
      quiz: req.params.id,
      student: req.user.id,
      source,
    });

    if (existing) {
      return res.status(400).json({
        message:
          source === "retake"
            ? "You've already retaken this quiz."
            : "Quiz already submitted",
      });
    }

    let score = 0;

    quiz.questions.forEach((q, index) => {
      if (q.correctAnswer === req.body.answers[index]) {
        score++;
      }
    });

    const response = await QuizResponse.create({
      quiz: req.params.id,
      student: req.user.id,
      answers: req.body.answers,
      score,
      source,
    });

    res.json({
      message: "Quiz submitted",
      score,
      response,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getResults = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    const responses = await QuizResponse.find({
      quiz: req.params.id,
    })

      .populate("student", "name email");

    // Per-question breakdown: correct / incorrect / unanswered, computed
    // from every student's `answers` array against `quiz.questions`.
    const questionStats = quiz.questions.map((q, index) => ({
      questionId: q._id,
      question: q.question,
      correct: 0,
      incorrect: 0,
      unanswered: 0,
    }));

    responses.forEach((response) => {
      quiz.questions.forEach((q, index) => {
        const given = response.answers ? response.answers[index] : undefined;

        if (given === undefined || given === null || given === -1) {
          questionStats[index].unanswered += 1;
        } else if (given === q.correctAnswer) {
          questionStats[index].correct += 1;
        } else {
          questionStats[index].incorrect += 1;
        }
      });
    });

    res.json({
      perStudent: responses,
      perQuestion: questionStats,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================
// TEACHER: open/close a quiz for students to self-attempt after the
// live session (from the Quiz page, no socket/live session needed).
// Also flips `launched` so the quiz becomes visible to students at all,
// covering the case where a quiz was created but never actually
// launched live yet.
// ======================================
exports.toggleRetake = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    quiz.openForRetake = Boolean(req.body.open);
    if (quiz.openForRetake) {
      quiz.launched = true;
    }

    await quiz.save();

    res.json({
      message: quiz.openForRetake
        ? "Quiz opened for retake"
        : "Quiz closed for retake",
      launched: quiz.launched,
      openForRetake: quiz.openForRetake,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await quiz.deleteOne();

    res.json({
      message: "Quiz deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
