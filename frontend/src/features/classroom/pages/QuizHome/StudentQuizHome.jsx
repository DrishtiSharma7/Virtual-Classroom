import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ClipboardList,
  CheckCircle2,
  Circle,
  FileQuestion,
  ChevronRight,
} from "lucide-react";

import { getMyClassrooms } from "../../api/classroom.api";
import { getClassroomQuizzes } from "../../api/quiz.api";

export default function StudentQuizHome() {
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState([]);
  const [classroomId, setClassroomId] = useState("");
  const [quizzes, setQuizzes] = useState([]);

  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [filter, setFilter] = useState("all"); // all | attempted | pending

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
    <div className="max-w-8xl px-8 py-3">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <ClipboardList className="text-[#4f46e5]" size={26} />
          Quizzes
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          See how you did on quizzes you've taken, and which ones are still
          pending.
        </p>
      </div>

      {loadingClassrooms ? (
        <p className="text-sm text-gray-400">Loading classrooms...</p>
      ) : classrooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          You haven't joined a classroom yet. Join one to see its quizzes.
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
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-400">Total</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {quizzes.length}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-400">Attempted</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                {attemptedCount}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-400">Pending</p>
              <p className="mt-1 text-xl font-bold text-amber-600">
                {pendingCount}
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="mb-4 inline-flex rounded-xl border border-gray-200 bg-white p-1 text-sm">
            {[
              { key: "all", label: "All" },
              { key: "attempted", label: "Attempted" },
              { key: "pending", label: "Not attempted" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  filter === tab.key
                    ? "bg-[#4f46e5] text-white"
                    : "text-gray-500 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loadingQuizzes ? (
            <p className="text-sm text-gray-400">Loading quizzes...</p>
          ) : visibleQuizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              No quizzes here yet.
            </div>
          ) : (
            <div className="space-y-2">
              {visibleQuizzes.map((q) => (
                <button
                  key={q._id}
                  onClick={() => navigate(`/quizzes/${q._id}`)}
                  className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-[#4f46e5]/40 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {q.attempted ? (
                      <CheckCircle2
                        className="shrink-0 text-emerald-500"
                        size={22}
                      />
                    ) : (
                      <Circle className="shrink-0 text-gray-300" size={22} />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{q.title}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-500">
                        <FileQuestion size={12} />
                        {q.questionCount} question
                        {q.questionCount === 1 ? "" : "s"}
                        {q.session?.title ? ` · ${q.session.title}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {q.attempted ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Score {q.score}/{q.questionCount}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        Not attempted
                      </span>
                    )}
                    {q.openForRetake && (
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#4f46e5]">
                        {q.attempted ? "Retake open" : "Open now"}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
