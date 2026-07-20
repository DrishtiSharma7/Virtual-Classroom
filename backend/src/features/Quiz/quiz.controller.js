const Quiz = require("./quiz.model");
const QuizResponse = require("./quizResponse.model");

exports.createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create({
      session: req.body.session,
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

exports.submitQuiz = async (req, res) => {
  try {
    const existing = await QuizResponse.findOne({
      quiz: req.params.id,
      student: req.user.id,
    });

    if (existing) {
      return res.status(400).json({
        message: "Quiz already submitted",
      });
    }

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
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
    const responses = await QuizResponse.find({
      quiz: req.params.id,
    })

      .populate(
        "student",
        "name email",
      );

    res.json(responses);
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
