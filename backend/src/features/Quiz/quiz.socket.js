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

  // Teacher launches a quiz to everyone in the session room.
  // Strip correctAnswer before broadcasting so students can't inspect it via devtools.
  socket.on("launch-quiz", async (data) => {
    if (!data?.sessionId || !requireTeacher(data.sessionId, "launch-quiz")) {
      return;
    }

    // data: { sessionId, quiz } where quiz is the full Quiz doc from createQuiz's response
    const sanitizedQuestions = data.quiz.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      timeLimit: q.timeLimit || 60,
    }));

    try {
      await Quiz.findByIdAndUpdate(data.quiz._id, { launched: true });
    } catch {
      // Non-fatal — the live launch still proceeds even if this write fails.
    }

    io.to(data.sessionId).emit("quiz-launched", {
      quizId: data.quiz._id,
      questions: sanitizedQuestions,
    });
  });

  // Teacher moves to / reveals a specific question index and its correct answer,
  // once that question's timer has ended.
  socket.on("reveal-answer", (data) => {
    if (!data?.sessionId || !requireTeacher(data.sessionId, "reveal-answer")) {
      return;
    }

    // data: { sessionId, questionIndex, correctAnswer }
    io.to(data.sessionId).emit("answer-revealed", data);
  });

  // Optional live tally: student notifies room they've answered (no answer content sent).
  socket.on("student-answered", (data) => {
    // data: { sessionId, studentId }
    socket.to(data.sessionId).emit("live-answer-count", data);
  });

  // Teacher ends the quiz for everyone.
  socket.on("close-quiz", (data) => {
    if (!data?.sessionId || !requireTeacher(data.sessionId, "close-quiz")) {
      return;
    }

    // data: { sessionId, quizId }
    io.to(data.sessionId).emit("quiz-closed", { quizId: data.quizId });
  });
};
