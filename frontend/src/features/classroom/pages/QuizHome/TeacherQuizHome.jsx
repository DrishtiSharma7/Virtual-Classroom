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
  CalendarDays,
  FileQuestion,
  Eye,
  X,
  Loader2,
  Radio,
  RadioTower,
} from "lucide-react";

import "./QuizHome.css";
import StatCard from "../../../dashboard/components/StatCard/StatCard";
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

  const [classrooms, setClassrooms] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_classrooms");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [classroomId, setClassroomId] = useState(() => classrooms[0]?._id || "");
  const [sessions, setSessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  const [loadingClassrooms, setLoadingClassrooms] = useState(classrooms.length === 0);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  const [showBuilder, setShowBuilder] = useState(false);
  const [title, setTitle] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [builderError, setBuilderError] = useState("");
  const [exportingId, setExportingId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyClassrooms();
        if (Array.isArray(data)) {
          setClassrooms(data);
          localStorage.setItem("cached_classrooms", JSON.stringify(data));
          if (!classroomId && data.length > 0) setClassroomId(data[0]._id);
        }
      } catch {
        if (classrooms.length === 0) {
          toast.error("Could not load your classrooms.");
        }
      } finally {
        setLoadingClassrooms(false);
      }
    })();
  }, []);

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

  const totalResponses = quizzes.reduce(
    (sum, q) => sum + (q.responseCount || 0),
    0
  );

  return (
    <div className="quiz-page">
      <div className="quiz-container">
        <div className="quiz-header">
          <div>
            <h1 className="quiz-title">
              <ClipboardList className="text-indigo-600" size={26} />
              Quizzes
            </h1>
            <p className="quiz-subtitle">
              Build quizzes with Excel import, launch them live, and export
              results.
            </p>
          </div>

          <div className="header-buttons">
            <button
              onClick={downloadQuizTemplate}
              data-tooltip="Download Excel quiz question template"
              title="Download the Excel template"
              className="secondary-btn"
            >
              <Download size={18} /> Download Template
            </button>
            <button
              onClick={handleQuickImportClick}
              disabled={loadingClassrooms || classrooms.length === 0}
              data-tooltip="Import quiz questions from an Excel file"
              title="Import questions from an Excel file"
              className="secondary-btn"
            >
              <Upload size={18} /> Import Excel
            </button>
            <button
              onClick={openBuilder}
              disabled={loadingClassrooms || classrooms.length === 0}
              data-tooltip="Create a new quiz for your classroom"
              title="New Quiz"
              className="export-btn"
            >
              <Plus size={18} /> New Quiz
            </button>
          </div>
        </div>


        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />


        {loadingClassrooms ? (
          <div className="animate-pulse space-y-3 p-4">
            <div className="h-10 w-64 bg-gray-200 rounded-xl" />
            <div className="h-28 w-full bg-gray-100 rounded-2xl" />
          </div>
        ) : classrooms.length === 0 ? (
          <div className="no-data">
            You don't have any classrooms yet. Create one to start adding
            quizzes.
          </div>
        ) : (
          <>
            <div className="filter-card">
              <label className="filter-label">Classroom</label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="classroom-select"
              >
                {classrooms.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.subject}
                  </option>
                ))}
              </select>
            </div>


            <div className="quiz-stats-grid">
              <StatCard
                icon={<ClipboardList />}
                label="Total Quizzes"
                value={quizzes.length}
                colorClass="bg-blue-soft"
              />
              <StatCard
                icon={<Users />}
                label="Total Submissions"
                value={totalResponses}
                colorClass="bg-orange-soft"
              />
              <StatCard
                icon={<CalendarDays />}
                label="Class Sessions"
                value={sessions.length}
                colorClass="bg-purple-soft"
              />
            </div>


            {loadingQuizzes ? (
              <div className="animate-pulse space-y-3 p-6 bg-white rounded-2xl border border-gray-100">
                <div className="h-8 w-full bg-gray-100 rounded-lg" />
                <div className="h-8 w-full bg-gray-100 rounded-lg" />
                <div className="h-8 w-full bg-gray-100 rounded-lg" />
              </div>
            ) : quizzes.length === 0 ? (
              <div className="no-data">
                No quizzes created for this classroom yet.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="quiz-table">
                  <thead className="table-head">
                    <tr>
                      <th className="table-heading">Quiz</th>
                      <th className="table-heading">Session</th>
                      <th className="table-heading">Questions</th>
                      <th className="table-heading">Submissions</th>
                      <th className="table-heading">Status</th>
                      <th className="table-heading text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.map((q) => (
                      <tr key={q._id} className="table-row">
                        <td className="table-cell">
                          <p className="entity-name">{q.title}</p>
                        </td>
                        <td className="table-cell">
                          {q.session?.title || "—"}
                        </td>
                        <td className="table-cell">
                          <span className="inline-flex items-center gap-1">
                            <FileQuestion size={14} /> {q.questionCount}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="inline-flex items-center gap-1">
                            <Users size={14} /> {q.responseCount}
                          </span>
                        </td>
                        <td className="table-cell">
                          {q.openForRetake ? (
                            <span className="status-live">
                              <RadioTower
                                size={12}
                                className="mr-1 inline-block"
                              />
                              Open for retake
                            </span>
                          ) : q.launched ? (
                            <span className="status-neutral">Launched</span>
                          ) : (
                            <span className="status-absent">
                              Not launched yet
                            </span>
                          )}
                        </td>
                        <td className="table-cell">
                          <div className="action-buttons">
                            <button
                              onClick={() => handleToggleRetake(q)}
                              data-tooltip={
                                q.openForRetake
                                  ? "Close self-attempt retake for students"
                                  : "Open quiz for students to self-attempt"
                              }
                              title={
                                q.openForRetake
                                  ? "Close retake"
                                  : "Open for students to self-attempt"
                              }
                              className="toggle-btn"
                            >
                              <Radio
                                size={18}
                                className={
                                  q.openForRetake
                                    ? "text-emerald-600"
                                    : "text-gray-500"
                                }
                              />
                            </button>
                            <button
                              onClick={() => navigate(`/quizzes/${q._id}`)}
                              data-tooltip="View quiz details and responses"
                              title="View quiz"
                              className="view-btn"
                            >
                              <Eye size={18} className="view-icon" />
                            </button>
                            <button
                              onClick={() => handleExport(q)}
                              disabled={exportingId === q._id}
                              data-tooltip="Export student results to Excel"
                              title="Export results to Excel"
                              className="download-btn"
                            >
                              {exportingId === q._id ? (
                                <Loader2
                                  size={18}
                                  className="animate-spin text-gray-500"
                                />
                              ) : (
                                <Download
                                  size={18}
                                  className="text-gray-500"
                                />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(q._id)}
                              data-tooltip="Permanently delete this quiz"
                              title="Delete quiz"
                              className="delete-btn"
                            >
                              <Trash2 size={18} className="delete-icon" />
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


        {showBuilder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">New Quiz</h2>
                <button
                  onClick={() => setShowBuilder(false)}
                  data-tooltip="Close quiz builder modal"
                  title="Close"
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
                  data-tooltip="Import questions from Excel sheet"
                  title="Import from Excel"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-slate-50"
                >
                  <Upload size={13} /> Import from Excel
                </button>
                <button
                  onClick={downloadQuizTemplate}
                  data-tooltip="Download sample Excel template"
                  title="Download template"
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
                          data-tooltip="Delete this question"
                          title="Delete question"
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
                  data-tooltip="Add another question to quiz"
                  title="Add question"
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-1.5 text-xs font-medium text-gray-500 hover:bg-slate-50"
                >
                  <Plus size={13} /> Add question
                </button>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <button
                  onClick={() => setShowBuilder(false)}
                  data-tooltip="Discard changes and exit"
                  title="Cancel"
                  className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  data-tooltip="Save and publish this quiz"
                  title="Save Quiz"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
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
    </div>
  );
}
