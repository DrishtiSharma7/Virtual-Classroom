import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ClipboardList,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  Hourglass,
  FileQuestion,
  ChevronRight,
} from "lucide-react";

import "./QuizHome.css";
import StatCard from "../../../dashboard/components/StatCard/StatCard";
import { getMyClassrooms } from "../../api/classroom.api";
import { getClassroomQuizzes } from "../../api/quiz.api";

export default function StudentQuizHome() {
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
  const [quizzes, setQuizzes] = useState([]);

  const [loadingClassrooms, setLoadingClassrooms] = useState(classrooms.length === 0);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [filter, setFilter] = useState("all");

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

  useEffect(() => {
    if (!classroomId) return;

    (async () => {
      setLoadingQuizzes(true);
      try {
        const data = await getClassroomQuizzes(classroomId);
        setQuizzes(data);
      } catch {
        toast.error("Could not load quizzes for this classroom.");
      } finally {
        setLoadingQuizzes(false);
      }
    })();
  }, [classroomId]);

  const attemptedCount = quizzes.filter((q) => q.attempted).length;
  const pendingCount = quizzes.length - attemptedCount;

  const visibleQuizzes = quizzes.filter((q) => {
    if (filter === "attempted") return q.attempted;
    if (filter === "pending") return !q.attempted;
    return true;
  });

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
              See how you did on quizzes you've taken, and which ones are
              still pending.
            </p>
          </div>
        </div>

        {loadingClassrooms ? (
          <div className="animate-pulse space-y-3 p-4">
            <div className="h-10 w-64 bg-gray-200 rounded-xl" />
            <div className="h-28 w-full bg-gray-100 rounded-2xl" />
          </div>
        ) : classrooms.length === 0 ? (
          <div className="no-data">
            You haven't joined a classroom yet. Join one to see its quizzes.
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

              <div className="filter-tabs">
                {[
                  { key: "all", label: "All" },
                  { key: "attempted", label: "Attempted" },
                  { key: "pending", label: "Not attempted" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    data-tooltip={`Filter quizzes: ${tab.label}`}
                    title={tab.label}
                    className={`filter-tab ${
                      filter === tab.key ? "filter-tab-active" : ""
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>


            <div className="quiz-stats-grid">
              <StatCard
                icon={<ClipboardList />}
                label="Total"
                value={quizzes.length}
                colorClass="bg-blue-soft"
              />
              <StatCard
                icon={<ClipboardCheck />}
                label="Attempted"
                value={attemptedCount}
                colorClass="bg-green-soft"
              />
              <StatCard
                icon={<Hourglass />}
                label="Pending"
                value={pendingCount}
                colorClass="bg-orange-soft"
              />
            </div>

            {loadingQuizzes ? (
              <div className="animate-pulse space-y-3 p-6 bg-white rounded-2xl border border-gray-100">
                <div className="h-8 w-full bg-gray-100 rounded-lg" />
                <div className="h-8 w-full bg-gray-100 rounded-lg" />
                <div className="h-8 w-full bg-gray-100 rounded-lg" />
              </div>
            ) : visibleQuizzes.length === 0 ? (
              <div className="no-data">No quizzes here yet.</div>
            ) : (
              <div className="table-wrapper">
                <table className="quiz-table">
                  <thead className="table-head">
                    <tr>
                      <th className="table-heading">Quiz</th>
                      <th className="table-heading">Session</th>
                      <th className="table-heading">Questions</th>
                      <th className="table-heading">Status</th>
                      <th className="table-heading text-center">Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleQuizzes.map((q) => (
                      <tr
                        key={q._id}
                        className="table-row cursor-pointer"
                        onClick={() => navigate(`/quizzes/${q._id}`)}
                      >
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            {q.attempted ? (
                              <CheckCircle2
                                className="shrink-0 text-emerald-500"
                                size={18}
                              />
                            ) : (
                              <Circle
                                className="shrink-0 text-gray-300"
                                size={18}
                              />
                            )}
                            <p className="entity-name">{q.title}</p>
                          </div>
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
                          {q.attempted ? (
                            <span className="status-present">
                              Score {q.score}/{q.questionCount}
                            </span>
                          ) : (
                            <span className="status-absent">
                              Not attempted
                            </span>
                          )}
                          {q.openForRetake && (
                            <span className="status-live ml-2">
                              {q.attempted ? "Retake open" : "Open now"}
                            </span>
                          )}
                        </td>
                        <td className="table-cell text-center">
                          <ChevronRight
                            size={18}
                            className="inline-block text-gray-300"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
