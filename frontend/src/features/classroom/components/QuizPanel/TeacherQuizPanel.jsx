import React, { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Plus,
  Trash2,
  Upload,
  X,
  Download,
  Radio,
  FileQuestion,
  Users,
  ArrowLeft,
} from "lucide-react";

import {
  createQuiz,
  getClassroomQuizzes,
  getQuizDetail,
  getQuizResults,
} from "../../api/quiz.api";
import {
  downloadQuizTemplate,
  exportResultsToExcel,
  parseQuizExcel,
} from "../../utils/quizExcel";

const emptyQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  timeLimit: 60,
});

/**
 * Teacher-facing Live Quiz panel.
 *
 * props:
 *  - socket: the live socket.io-client instance (socketRef.current)
 *  - sessionId: current live session id (room id)
 *  - classroomId: current classroom id (used to list previously saved quizzes)
 *  - onClose: called when the panel's X button is clicked
 */
export default function TeacherQuizPanel({
  socket,
  sessionId,
  classroomId,
  onClose,
}) {
  const [stage, setStage] = useState("select"); // select | builder | live | results
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Previously saved quizzes for this classroom, so the teacher can pick
  // one of their own choosing instead of always building from scratch.
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [launchingId, setLaunchingId] = useState(null);

  // Full quiz doc (still has correctAnswer client-side; only the socket
  // broadcast to students strips it, on the backend).
  const [quiz, setQuiz] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [liveAnswerCount, setLiveAnswerCount] = useState(0);
  const timerRef = useRef(null);

  // { perStudent: [...], perQuestion: [...] } — API shape changed when the
  // per-question breakdown was added (previously a bare array).
  const [results, setResults] = useState({ perStudent: [], perQuestion: [] });
  const [resultsLoading, setResultsLoading] = useState(false);

  /* ---------------- Saved quiz selection ---------------- */

  useEffect(() => {
    if (stage !== "select" || !classroomId) return;

    let cancelled = false;

    (async () => {
      setLoadingSaved(true);
      try {
        const data = await getClassroomQuizzes(classroomId);
        if (!cancelled) setSavedQuizzes(data);
      } catch {
        if (!cancelled) setSavedQuizzes([]);
      } finally {
        if (!cancelled) setLoadingSaved(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stage, classroomId]);

  const handleSelectSaved = async (summary) => {
    setError("");
    setLaunchingId(summary._id);

    try {
      const full = await getQuizDetail(summary._id);

      const localQuiz = { _id: full._id, questions: full.questions };

      setQuiz(localQuiz);
      setQuestionIndex(0);
      setRevealed(false);
      setLiveAnswerCount(0);

      socket?.emit("launch-quiz", { sessionId, quiz: localQuiz });

      setStage("live");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not launch this quiz.");
    } finally {
      setLaunchingId(null);
    }
  };

  /* ---------------- Question builder ---------------- */

  const updateQuestion = (index, patch) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );
  };

  const updateOption = (qIndex, optIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((o, oi) => (oi === optIndex ? value : o)),
            }
          : q
      )
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (index) =>
    setQuestions((prev) => prev.filter((_, i) => i !== index));

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      const imported = await parseQuizExcel(file);
      setQuestions((prev) => [
        ...prev.filter((q) => q.question.trim() !== ""),
        ...imported,
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      e.target.value = "";
    }
  };

  const validQuestions = questions.filter(
    (q) =>
      q.question.trim() &&
      q.options.filter((o) => o.trim()).length >= 2 &&
      q.timeLimit >= 30 &&
      q.timeLimit <= 120
  );

  /* ---------------- Launch ---------------- */

  const handleLaunch = async () => {
    if (validQuestions.length === 0) {
      setError(
        "Add at least one question with 2+ options and a time limit between 30-120s."
      );
      return;
    }

    try {
      setCreating(true);
      setError("");

      const { quiz: createdQuiz } = await createQuiz({
        session: sessionId,
        questions: validQuestions.map((q) => ({
          question: q.question.trim(),
          options: q.options.filter((o) => o.trim()),
          correctAnswer: Number(q.correctAnswer),
          timeLimit: Number(q.timeLimit) || 60,
        })),
      });

      setQuiz(createdQuiz);
      setQuestionIndex(0);
      setRevealed(false);
      setLiveAnswerCount(0);

      socket?.emit("launch-quiz", { sessionId, quiz: createdQuiz });

      setStage("live");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not launch quiz.");
    } finally {
      setCreating(false);
    }
  };

  /* ---------------- Live question timer ---------------- */

  useEffect(() => {
    if (stage !== "live" || !quiz) return;

    const current = quiz.questions[questionIndex];
    setTimeLeft(current?.timeLimit || 60);
    setRevealed(false);
    setLiveAnswerCount(0);

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, questionIndex, quiz]);

  useEffect(() => {
    if (!socket) return;

    const onLiveCount = () => setLiveAnswerCount((c) => c + 1);
    socket.on("live-answer-count", onLiveCount);

    return () => socket.off("live-answer-count", onLiveCount);
  }, [socket]);

  const handleReveal = () => {
    if (!quiz) return;
    const current = quiz.questions[questionIndex];

    clearInterval(timerRef.current);
    setRevealed(true);

    socket?.emit("reveal-answer", {
      sessionId,
      questionIndex,
      correctAnswer: current.correctAnswer,
    });
  };

  const handleNext = () => {
    if (questionIndex + 1 < quiz.questions.length) {
      setQuestionIndex((i) => i + 1);
    } else {
      handleEndQuiz();
    }
  };

  const handleEndQuiz = async () => {
    clearInterval(timerRef.current);
    socket?.emit("close-quiz", { sessionId, quizId: quiz._id });

    setStage("results");
    setResultsLoading(true);

    try {
      const data = await getQuizResults(quiz._id);
      setResults({
        perStudent: data?.perStudent || [],
        perQuestion: data?.perQuestion || [],
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load results.");
    } finally {
      setResultsLoading(false);
    }
  };

  const handleExport = () => {
    exportResultsToExcel(
      results.perStudent,
      quiz?.questions?.[0]?.question ? "Quiz Results" : "Quiz Results"
    );
  };

  const handleStartNewQuiz = () => {
    setQuiz(null);
    setQuestions([emptyQuestion()]);
    setResults([]);
    setQuestionIndex(0);
    setStage("select");
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Live Quiz Panel</h3>
        <div className="flex items-center gap-2 text-slate-400">
          <MoreVertical size={16} />
          <button onClick={onClose} aria-label="Close quiz panel">
            <X size={16} />
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-2 rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-600">
          {error}
        </p>
      )}

      {/* -------- Select a saved quiz, or build a new one -------- */}
      {stage === "select" && (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          <button
            onClick={() => {
              setQuestions([emptyQuestion()]);
              setStage("builder");
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={14} /> Build New Quiz
          </button>

          <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Or launch a saved quiz
          </p>

          {loadingSaved ? (
            <p className="py-4 text-center text-xs text-slate-400">
              Loading your quizzes...
            </p>
          ) : savedQuizzes.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              No saved quizzes yet for this classroom.
            </p>
          ) : (
            savedQuizzes.map((q) => (
              <div
                key={q._id}
                className="rounded-xl border border-slate-200 p-3"
              >
                <p className="mb-1 text-sm font-medium text-slate-800">
                  {q.title}
                </p>
                <div className="mb-2 flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileQuestion size={11} /> {q.questionCount} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {q.responseCount} submissions
                  </span>
                </div>
                <button
                  onClick={() => handleSelectSaved(q)}
                  disabled={launchingId === q._id}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                >
                  <Radio size={12} />
                  {launchingId === q._id ? "Launching..." : "Launch Live"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* -------- Builder -------- */}
      {stage === "builder" && (
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          <button
            onClick={() => setStage("select")}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft size={12} /> Back to saved quizzes
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleImportClick}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Upload size={13} /> Import Excel
            </button>
            <button
              onClick={downloadQuizTemplate}
              title="Download template"
              className="flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
            >
              <Download size={13} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {questions.map((q, qi) => (
            <div
              key={qi}
              className="rounded-xl border border-slate-200 p-3 text-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Question {qi + 1}
                </span>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qi)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <input
                value={q.question}
                onChange={(e) =>
                  updateQuestion(qi, { question: e.target.value })
                }
                placeholder="Question text"
                className="mb-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
              />

              <div className="mb-2 grid grid-cols-2 gap-1.5">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${
                      Number(q.correctAnswer) === oi
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={Number(q.correctAnswer) === oi}
                      onChange={() => updateQuestion(qi, { correctAnswer: oi })}
                    />
                    <input
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="w-full bg-transparent outline-none"
                    />
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-1.5 text-xs text-slate-500">
                Time limit (30-120s)
                <input
                  type="number"
                  min={30}
                  max={120}
                  value={q.timeLimit}
                  onChange={(e) =>
                    updateQuestion(qi, { timeLimit: Number(e.target.value) })
                  }
                  className="w-16 rounded-lg border border-slate-200 px-1.5 py-1"
                />
              </label>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
          >
            <Plus size={13} /> Add question
          </button>

          <button
            onClick={handleLaunch}
            disabled={creating}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {creating ? "Launching..." : "Launch Quiz"}
          </button>
        </div>
      )}

      {/* -------- Live -------- */}
      {stage === "live" && quiz && (
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-400">
            Question {questionIndex + 1} of {quiz.questions.length}
          </p>
          <p className="mb-3 text-sm text-slate-700">
            {quiz.questions[questionIndex].question}
          </p>

          <div className="mb-3 grid grid-cols-2 gap-2">
            {quiz.questions[questionIndex].options.map((opt, oi) => (
              <div
                key={oi}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  revealed && oi === quiz.questions[questionIndex].correctAnswer
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {opt}
              </div>
            ))}
          </div>

          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${
                  (timeLeft / (quiz.questions[questionIndex].timeLimit || 60)) *
                  100
                }%`,
              }}
            />
          </div>
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span>{liveAnswerCount} answered</span>
            <span>{String(timeLeft).padStart(2, "0")}s</span>
          </div>

          <div className="flex items-center gap-2">
            {!revealed ? (
              <button
                onClick={handleReveal}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Reveal Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                {questionIndex + 1 < quiz.questions.length
                  ? "Next Question"
                  : "End & Show Results"}
              </button>
            )}
            <button
              onClick={handleEndQuiz}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
            >
              End
            </button>
          </div>
        </div>
      )}

      {/* -------- Results -------- */}
      {stage === "results" && (
        <div>
          {resultsLoading ? (
            <p className="py-4 text-center text-sm text-slate-400">
              Loading results...
            </p>
          ) : (
            <>
              {/* Bug #11: per-question correct/incorrect/unanswered
                  breakdown, alongside the existing per-student totals. */}
              {results.perQuestion.length > 0 && (
                <div className="mb-3 max-h-[160px] space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-2">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Per-question breakdown
                  </p>
                  {results.perQuestion.map((q, i) => (
                    <div
                      key={q.questionId || i}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate text-slate-600">
                        Q{i + 1}. {q.question}
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-slate-500">
                        <span className="text-emerald-600">
                          {q.correct} correct
                        </span>
                        {" / "}
                        <span className="text-red-500">
                          {q.incorrect} incorrect
                        </span>
                        {q.unanswered > 0 && (
                          <>
                            {" / "}
                            <span className="text-slate-400">
                              {q.unanswered} unanswered
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-2 max-h-[260px] space-y-1 overflow-y-auto">
                {results.perStudent.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">
                    No submissions yet.
                  </p>
                ) : (
                  results.perStudent.map((r) => (
                    <div
                      key={r._id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-2 py-1.5 text-xs"
                    >
                      <span className="font-medium text-slate-700">
                        {r.student?.name || "Unknown"}
                      </span>
                      <span className="text-slate-500">
                        {r.score}/{quiz?.questions?.length ?? "-"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  disabled={results.perStudent.length === 0}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Download size={14} /> Export to Excel
                </button>
                <button
                  onClick={handleStartNewQuiz}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  New Quiz
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
