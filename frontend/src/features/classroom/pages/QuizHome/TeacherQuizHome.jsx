import { useEffect, useState, useMemo, useCallback } from "react";
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
  Loader2,
  Radio,
  RadioTower,
} from "lucide-react";

import "./QuizHome.css";
import StatCard from "../../../dashboard/components/StatCard/StatCard";
import { getMyClassrooms } from "../../api/classroom.api";
import { getSessionsByClassroom } from "../../../auth/api/session.api";
import {
  deleteQuiz,
  getClassroomQuizzes,
  getQuizResults,
  toggleQuizRetake,
} from "../../api/quiz.api";
import {
  downloadQuizTemplate,
  exportResultsToExcel,
} from "../../utils/quizExcel";
import QuizBuilderModal from "./components/QuizBuilderModal";

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
  const [exportingId, setExportingId] = useState(null);

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

  const loadQuizzes = useCallback(async (id) => {
    setLoadingQuizzes(true);
    try {
      const data = await getClassroomQuizzes(id);
      setQuizzes(data);
    } catch {
      toast.error("Could not load quizzes for this classroom.");
    } finally {
      setLoadingQuizzes(false);
    }
  }, []);

  // Parallel fetch quizzes & sessions for selected classroom
  useEffect(() => {
    if (!classroomId) return;

    let active = true;
    (async () => {
      setLoadingQuizzes(true);
      try {
        const [quizRes, sessionRes] = await Promise.allSettled([
          getClassroomQuizzes(classroomId),
          getSessionsByClassroom(classroomId),
        ]);

        if (!active) return;

        if (quizRes.status === "fulfilled") {
          setQuizzes(quizRes.value);
        } else {
          toast.error("Could not load quizzes for this classroom.");
        }

        if (sessionRes.status === "fulfilled") {
          setSessions(sessionRes.value?.data || []);
        } else {
          setSessions([]);
        }
      } finally {
        if (active) setLoadingQuizzes(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [classroomId]);

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

  const totalResponses = useMemo(
    () => quizzes.reduce((sum, q) => sum + (q.responseCount || 0), 0),
    [quizzes]
  );

  return (
    <div className="quiz-page">
      <div className="quiz-container">
        <div className="quiz-header">
          <div>
            <h1 className="quiz-title hidden lg:flex">
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
              data-tooltip="Download Template"
              title="Download the Excel template"
              className="secondary-btn"
            >
              <Download size={18} /> Download Template
            </button>
            <button
              onClick={() => setShowBuilder(true)}
              disabled={loadingClassrooms || classrooms.length === 0}
              data-tooltip="Import Excel"
              title="Import questions from an Excel file"
              className="secondary-btn"
            >
              <Upload size={18} /> Import Excel
            </button>
            <button
              onClick={() => setShowBuilder(true)}
              disabled={loadingClassrooms || classrooms.length === 0}
              data-tooltip="New Quiz"
              title="New Quiz"
              className="export-btn"
            >
              <Plus size={18} /> New Quiz
            </button>
          </div>
        </div>

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
                              data-tooltip="View Quiz"
                              title="View quiz"
                              className="view-btn"
                            >
                              <Eye size={18} className="view-icon" />
                            </button>
                            <button
                              onClick={() => handleExport(q)}
                              disabled={exportingId === q._id}
                              data-tooltip="Export Excel"
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
                              data-tooltip="Delete Quiz"
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

        <QuizBuilderModal
          isOpen={showBuilder}
          onClose={() => setShowBuilder(false)}
          sessions={sessions}
          onQuizSaved={() => loadQuizzes(classroomId)}
        />
      </div>
    </div>
  );
}
