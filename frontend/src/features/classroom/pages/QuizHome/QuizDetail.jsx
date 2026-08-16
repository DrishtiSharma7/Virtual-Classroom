import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Download,
  Users,
  Loader2,
  Circle,
  Radio,
  RadioTower,
  History,
} from "lucide-react";

import {
  getQuizDetail,
  getQuizResults,
  submitQuiz,
  toggleQuizRetake,
} from "../../api/quiz.api";
import { exportResultsToExcel } from "../../utils/quizExcel";

export default function QuizDetail() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { role } = useSelector((state) => state.auth);

  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState({ perStudent: [], perQuestion: [] });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [togglingRetake, setTogglingRetake] = useState(false);

  const [attempting, setAttempting] = useState(false);
  const [draftAnswers, setDraftAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadQuiz = async () => {
    try {
      const data = await getQuizDetail(quizId);
      setQuiz(data);

      if (role === "teacher") {
        const r = await getQuizResults(quizId);
        setResults({
          perStudent: r?.perStudent || [],
          perQuestion: r?.perQuestion || [],
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load this quiz.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadQuiz();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, role]);

  const handleExport = async () => {
    if (results.perStudent.length === 0) {
      toast("No submissions to export yet.");
      return;
    }
    setExporting(true);
    try {
      exportResultsToExcel(results.perStudent, quiz?.title || "Quiz Results");
    } finally {
      setExporting(false);
    }
  };

  const handleToggleRetake = async () => {
    const nextOpen = !quiz.openForRetake;
    setTogglingRetake(true);
    try {
      const result = await toggleQuizRetake(quizId, nextOpen);
      setQuiz((prev) => ({
        ...prev,
        launched: result.launched,
        openForRetake: result.openForRetake,
      }));
      toast.success(
        nextOpen
          ? "Quiz opened — students can now attempt it themselves."
          : "Retake closed for this quiz."
      );
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Could not update retake status."
      );
    } finally {
      setTogglingRetake(false);
    }
  };

  const startAttempt = () => {
    setDraftAnswers(new Array(quiz.questions.length).fill(-1));
    setAttempting(true);
  };

  const selectAnswer = (qIndex, optIndex) => {
    setDraftAnswers((prev) =>
      prev.map((a, i) => (i === qIndex ? optIndex : a))
    );
  };

  const handleSubmitRetake = async () => {
    if (draftAnswers.some((a) => a === -1)) {
      toast.error("Answer every question before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const { score } = await submitQuiz(quizId, draftAnswers, "retake");
      toast.success(`Submitted! You scored ${score}/${quiz.questions.length}.`);
      setAttempting(false);
      await loadQuiz();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Could not submit your attempt."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="mb-4 text-sm text-red-500">
          {error || "Quiz not found."}
        </p>
        <button
          onClick={() => navigate("/quizzes")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4f46e5] hover:underline"
        >
          <ArrowLeft size={15} /> Back to Quizzes
        </button>
      </div>
    );
  }

  const canRetakeNow =
    role !== "teacher" && quiz.openForRetake && !quiz.attemptedRetake;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate("/quizzes")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#4f46e5]"
      >
        <ArrowLeft size={15} /> Back to Quizzes
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
          {quiz.session?.title && (
            <p className="mt-0.5 text-sm text-gray-500">
              {quiz.session.title}
              {quiz.session.startTime &&
                ` · ${new Date(quiz.session.startTime).toLocaleDateString()}`}
            </p>
          )}
        </div>

        {role === "teacher" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleRetake}
              disabled={togglingRetake}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-60 ${
                quiz.openForRetake
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-gray-300 text-gray-700 hover:bg-slate-50"
              }`}
            >
              {togglingRetake ? (
                <Loader2 size={15} className="animate-spin" />
              ) : quiz.openForRetake ? (
                <RadioTower size={15} />
              ) : (
                <Radio size={15} />
              )}
              {quiz.openForRetake ? "Open for retake" : "Open for retake?"}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {exporting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              Export to Excel
            </button>
          </div>
        ) : quiz.attempted ? (
          <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
            Latest score {quiz.score}/{quiz.total}
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700">
            Not attempted
          </span>
        )}
      </div>

      {/* ---------------- Teacher: submissions summary ---------------- */}
      {role === "teacher" && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <Users size={15} /> Submissions ({results.perStudent.length})
          </p>
          {results.perStudent.length === 0 ? (
            <p className="text-sm text-gray-400">No submissions yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {results.perStudent.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {r.student?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400">{r.student?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        r.source === "retake"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-gray-600"
                      }`}
                    >
                      {r.source === "retake" ? "Retake" : "Live"}
                    </span>
                    <span className="font-semibold text-gray-700">
                      {r.score}/{quiz.questions?.length ?? "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------- Student: attempts history ---------------- */}
      {role !== "teacher" && quiz.attempted && quiz.attempts?.length > 0 && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <History size={15} /> Your attempts
          </p>
          <div className="divide-y divide-gray-100">
            {quiz.attempts.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="capitalize text-gray-600">
                  {a.source === "retake" ? "Retake" : "Live session"}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {new Date(a.submittedAt).toLocaleString()}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {a.score}/{quiz.total}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Student: not attempted, retake closed ---------------- */}
      {role !== "teacher" && !quiz.attempted && !canRetakeNow && (
        <div className="mb-6 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5 text-sm text-amber-800">
          You haven't attempted this quiz yet. Your teacher launches it live
          during a class session — join the session to take it.
        </div>
      )}

      {/* ---------------- Student: quiz open for self-attempt ---------------- */}
      {canRetakeNow && !attempting && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-800">
            {quiz.attempted
              ? "Your teacher has opened this quiz for a retake."
              : "Your teacher has opened this quiz — you can attempt it now."}
          </p>
          <button
            onClick={startAttempt}
            className="shrink-0 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#5b5bd6] px-4 py-2 text-sm font-semibold text-white shadow-md hover:-translate-y-0.5"
          >
            {quiz.attempted ? "Retake Quiz" : "Attempt Quiz"}
          </button>
        </div>
      )}

      {/* ---------------- Attempt form (retake) ---------------- */}
      {attempting ? (
        <div className="space-y-4">
          {quiz.questions.map((q, index) => (
            <div
              key={q._id || index}
              className="rounded-2xl border border-gray-200 bg-white p-4"
            >
              <p className="mb-3 text-sm font-medium text-gray-800">
                {index + 1}. {q.question}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      draftAnswers[index] === oi
                        ? "border-[#4f46e5] bg-indigo-50 text-[#4f46e5]"
                        : "border-gray-200 text-gray-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${index}`}
                      className="hidden"
                      checked={draftAnswers[index] === oi}
                      onChange={() => selectAnswer(index, oi)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAttempting(false)}
              className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRetake}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#5b5bd6] py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ---------------- Questions (read-only: answer key / latest breakdown) ---------------- */
        <div className="space-y-4">
          {quiz.questions.map((q, index) => (
            <div
              key={q._id || index}
              className="rounded-2xl border border-gray-200 bg-white p-4"
            >
              <p className="mb-3 text-sm font-medium text-gray-800">
                {index + 1}. {q.question}
              </p>

              {role === "teacher" && results.perQuestion[index] && (
                <p className="mb-3 text-xs font-medium text-gray-500">
                  <span className="text-emerald-600">
                    {results.perQuestion[index].correct} correct
                  </span>
                  {" · "}
                  <span className="text-red-500">
                    {results.perQuestion[index].incorrect} incorrect
                  </span>
                  {results.perQuestion[index].unanswered > 0 && (
                    <>
                      {" · "}
                      <span className="text-gray-400">
                        {results.perQuestion[index].unanswered} unanswered
                      </span>
                    </>
                  )}
                </p>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  let stateClass = "border-gray-200 text-gray-600";
                  let icon = null;

                  if (role === "teacher") {
                    if (oi === q.correctAnswer) {
                      stateClass =
                        "border-emerald-300 bg-emerald-50 text-emerald-700";
                      icon = <CheckCircle2 size={14} />;
                    }
                  } else if (quiz.attempted) {
                    const isCorrectOpt = oi === q.correctAnswer;
                    const isSelected = oi === q.selectedAnswer;

                    if (isCorrectOpt) {
                      stateClass =
                        "border-emerald-300 bg-emerald-50 text-emerald-700";
                      icon = <CheckCircle2 size={14} />;
                    } else if (isSelected && !isCorrectOpt) {
                      stateClass = "border-red-300 bg-red-50 text-red-600";
                      icon = <XCircle size={14} />;
                    }
                  }

                  return (
                    <div
                      key={oi}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${stateClass}`}
                    >
                      {icon || <Circle size={12} className="text-gray-300" />}
                      {opt}
                    </div>
                  );
                })}
              </div>

              {role !== "teacher" && quiz.attempted && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    q.isCorrect ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {q.isCorrect
                    ? "You answered correctly."
                    : q.selectedAnswer === -1
                      ? "You didn't answer in time."
                      : "You answered incorrectly."}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
