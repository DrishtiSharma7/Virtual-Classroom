const Quiz = require("../Quiz/quiz.model");
const registry = require("../../sockets/roomRegistry");

module.exports = (io, socket) => {
  const requireTeacher = (sessionId, action) => {
    if (registry.isTeacher(sessionId, socket.id)) return true;

    socket.emit("action-denied", {
      action,
      message: "Only the host can control the quiz.",
    });
    return false;
  };

  socket.on("launch-quiz", async (data) => {
    if (!data?.sessionId || !requireTeacher(data.sessionId, "launch-quiz")) {
      return;
    }

    const sanitizedQuestions = data.quiz.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      timeLimit: q.timeLimit || 60,
    }));

    try {
      await Quiz.findByIdAndUpdate(data.quiz._id, { launched: true });
    } catch {}

    io.to(data.sessionId).emit("quiz-launched", {
      quizId: data.quiz._id,
      questions: sanitizedQuestions,
    });
  });

  socket.on("reveal-answer", (data) => {
    if (!data?.sessionId || !requireTeacher(data.sessionId, "reveal-answer")) {
      return;
    }

    io.to(data.sessionId).emit("answer-revealed", data);
  });

  socket.on("student-answered", (data) => {
    socket.to(data.sessionId).emit("live-answer-count", data);
  });

  socket.on("close-quiz", (data) => {
    if (!data?.sessionId || !requireTeacher(data.sessionId, "close-quiz")) {
      return;
    }

    io.to(data.sessionId).emit("quiz-closed", { quizId: data.quizId });
  });
};
