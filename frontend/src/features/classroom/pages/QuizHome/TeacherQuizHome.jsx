import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ClipboardList,
  Download,
  Upload,
  Plus,
  Trash2,
  Users,
  FileQuestion,
  Eye,
  X,
  Loader2,
  Radio,
  RadioTower,
} from "lucide-react";

import { getMyClassrooms } from "../../api/classroom.api";
import { getSessionsByClassroom } from "../../../auth/api/session.api";
import {
  createQuiz,
  deleteQuiz,
  getClassroomQuizzes,
  getQuizResults,
  toggleQuizRetake,
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

export default function TeacherQuizHome() {
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState([]);
  const [classroomId, setClassroomId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  const [showBuilder, setShowBuilder] = useState(false);
  const [title, setTitle] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [builderError, setBuilderError] = useState("");
  const [exportingId, setExportingId] = useState(null);
  const fileInputRef = useRef(null);

  /* ---------------- Load classrooms ---------------- */

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyClassrooms();
        setClassrooms(data);
        if (data.length > 0) setClassroomId(data[0]._id);
      } catch {
        toast.error("Could not load your classrooms.");
      } finally {
        setLoadingClassrooms(false);
      }
    })();
  }, []);

  /* ---------------- Load sessions + quizzes per classroom ---------------- */

  const loadQuizzes = async (id) => {
    setLoadingQuizzes(true);
    try {
      const data = await getClassroomQuizzes(id);
      setQuizzes(data);
    } catch {
      toast.error("Could not load quizzes for this classroom.");
    } finally {
      setLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    if (!classroomId) return;

    (async () => {
      await loadQuizzes(classroomId);

      try {
        const data = await getSessionsByClassroom(classroomId);
        setSessions(data.data);
      } catch {
        setSessions([]);
      }
    })();
  }, [classroomId]);

  /* ---------------- Builder helpers ---------------- */

  const openBuilder = () => {
    setTitle("");
    setSessionId(sessions[0]?._id || "");
    setQuestions([emptyQuestion()]);
    setBuilderError("");
    setShowBuilder(true);
  };

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

  // Triggered from the main list page (not from inside the modal): opens a
  // fresh builder and immediately prompts for the Excel file, so the whole
  // import happens without a separate "New Quiz" click first.
  const handleQuickImportClick = () => {
    openBuilder();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setBuilderError("");
      const imported = await parseQuizExcel(file);
      setQuestions((prev) => [
        ...prev.filter((q) => q.question.trim() !== ""),
        ...imported,
      ]);
      setShowBuilder(true);
      toast.success(`Imported ${imported.length} question(s) from Excel.`);
    } catch (err) {
      setBuilderError(err.message);
      setShowBuilder(true);
    } finally {
      e.target.value = "";
    }
  };

  const validQuestions = questions.filter(
    (q) =>
      q.question.trim() &&
      q.options.filter((o) => String(o).trim()).length >= 2 &&
      q.timeLimit >= 30 &&
      q.timeLimit <= 120
  );

  const handleSave = async () => {
    if (!sessionId) {
      setBuilderError("Select the class session this quiz belongs to.");
      return;
    }
    if (validQuestions.length === 0) {
      setBuilderError(
        "Add at least one question with 2+ options and a time limit between 30-120s."
      );
      return;
    }

    try {
      setSaving(true);
      setBuilderError("");

      await createQuiz({
        session: sessionId,
        title: title.trim() || "Untitled Quiz",
        questions: validQuestions.map((q) => ({
          question: q.question.trim(),
          options: q.options
            .map((o) => String(o).trim())
            .filter((o) => o !== ""),
          correctAnswer: Number(q.correctAnswer),
          timeLimit: Number(q.timeLimit) || 60,
        })),
      });

      toast.success("Quiz saved.");
      setShowBuilder(false);
      loadQuizzes(classroomId);
    } catch (err) {
      setBuilderError(
        err?.response?.data?.message || "Could not save the quiz."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- List actions ---------------- */

  const handleDelete = async (quizId) => {
    if (!window.confirm("Delete this quiz and all its responses?")) return;

    try {
      await deleteQuiz(quizId);
      toast.success("Quiz deleted.");
      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not delete quiz.");
    }
  };

  const handleExport = async (quiz) => {
    try {
      setExportingId(quiz._id);
      const { perStudent } = await getQuizResults(quiz._id);
      if (perStudent.length === 0) {
        toast("No submissions to export yet.");
        return;
      }
      exportResultsToExcel(perStudent, quiz.title);
    } catch {
      toast.error("Could not export results.");
    } finally {
      setExportingId(null);
    }
  };

  const handleToggleRetake = async (quiz) => {
    const nextOpen = !quiz.openForRetake;
    try {
      const result = await toggleQuizRetake(quiz._id, nextOpen);
      toast.success(
        nextOpen
          ? "Quiz opened — students can now attempt it themselves."
          : "Retake closed for this quiz."
      );
      setQuizzes((prev) =>
        prev.map((q) =>
          q._id === quiz._id
            ? {
                ...q,
                launched: result.launched,
                openForRetake: result.openForRetake,
              }
            : q
        )
      );
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Could not update retake status."
      );
    }
  };

  /* ---------------- Render ---------------- */

  const totalResponses = quizzes.reduce(
    (sum, q) => sum + (q.responseCount || 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl py-4 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <ClipboardList className="text-[#4f46e5]" size={26} />
            Quizzes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Build quizzes with Excel import, launch them live, and export
            results.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadQuizTemplate}
            title="Download the Excel template"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-slate-50"
          >
            <Download size={16} /> Download Template
          </button>
          <button
            onClick={handleQuickImportClick}
            disabled={loadingClassrooms || classrooms.length === 0}
            title="Import questions from an Excel file"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={16} /> Import Excel
          </button>
          <button
            onClick={openBuilder}
            disabled={loadingClassrooms || classrooms.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#5b5bd6] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} /> New Quiz
          </button>
        </div>
      </div>

      {/* Hidden file input shared by the top-level Import Excel button and
          the one inside the builder modal — always mounted so it works
          whether or not the modal is open. */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Classroom picker */}
      {loadingClassrooms ? (
        <p className="text-sm text-gray-400">Loading classrooms...</p>
      ) : classrooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          You don't have any classrooms yet. Create one to start adding quizzes.
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-600">
              Classroom
            </label>
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#4f46e5]"
            >
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} — {c.subject}
                </option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-400">Total Quizzes</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {quizzes.length}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-400">
                Total Submissions
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {totalResponses}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-400">
                Class Sessions
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {sessions.length}
              </p>
            </div>
          </div>

          {/* Quiz list */}
          {loadingQuizzes ? (
            <p className="text-sm text-gray-400">Loading quizzes...</p>
          ) : quizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              No quizzes created for this classroom yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Quiz</th>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Questions</th>
                    <th className="px-4 py-3">Submissions</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quizzes.map((q) => (
                    <tr key={q._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {q.title}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {q.session?.title || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <FileQuestion size={14} /> {q.questionCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Users size={14} /> {q.responseCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {q.openForRetake ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <RadioTower size={12} /> Open for retake
                          </span>
                        ) : q.launched ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                            Launched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Not launched yet
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleRetake(q)}
                            title={
                              q.openForRetake
                                ? "Close retake"
                                : "Open for students to self-attempt"
                            }
                            className={`rounded-lg border p-1.5 hover:bg-slate-50 ${
                              q.openForRetake
                                ? "border-emerald-300 text-emerald-600"
                                : "border-gray-200 text-gray-500"
                            }`}
                          >
                            <Radio size={15} />
                          </button>
                          <button
                            onClick={() => navigate(`/quizzes/${q._id}`)}
                            title="View quiz"
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-slate-50"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleExport(q)}
                            disabled={exportingId === q._id}
                            title="Export results to Excel"
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {exportingId === q._id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Download size={15} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(q._id)}
                            title="Delete quiz"
                            className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Builder modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">New Quiz</h2>
              <button
                onClick={() => setShowBuilder(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {builderError && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {builderError}
              </p>
            )}

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Quiz title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 3 Recap"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#4f46e5]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Class session
                </label>
                <select
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#4f46e5]"
                >
                  <option value="">Select a session</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.title} — {new Date(s.startTime).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                {sessions.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Create a class session for this classroom first.
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <button
                onClick={handleImportClick}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-slate-50"
              >
                <Upload size={13} /> Import from Excel
              </button>
              <button
                onClick={downloadQuizTemplate}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-slate-50"
              >
                <Download size={13} /> Download template
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q, qi) => (
                <div
                  key={qi}
                  className="rounded-xl border border-gray-200 p-3 text-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">
                      Question {qi + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(qi)}
                        className="text-gray-400 hover:text-red-500"
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
                    className="mb-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                  />

                  <div className="mb-2 grid grid-cols-2 gap-1.5">
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${
                          Number(q.correctAnswer) === oi
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={Number(q.correctAnswer) === oi}
                          onChange={() =>
                            updateQuestion(qi, { correctAnswer: oi })
                          }
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

                  <label className="flex items-center gap-1.5 text-xs text-gray-500">
                    Time limit (30-120s)
                    <input
                      type="number"
                      min={30}
                      max={120}
                      value={q.timeLimit}
                      onChange={(e) =>
                        updateQuestion(qi, {
                          timeLimit: Number(e.target.value),
                        })
                      }
                      className="w-16 rounded-lg border border-gray-200 px-1.5 py-1"
                    />
                  </label>
                </div>
              ))}

              <button
                onClick={addQuestion}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-1.5 text-xs font-medium text-gray-500 hover:bg-slate-50"
              >
                <Plus size={13} /> Add question
              </button>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => setShowBuilder(false)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#5b5bd6] py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Quiz"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
