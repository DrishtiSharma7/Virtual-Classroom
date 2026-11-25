import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { getStudentDetail } from "../api/analytics.api";
import { formatDateLabel } from "../utils/dateRanges";
import { CHART_COLORS } from "../utils/chartTheme";
import "./StudentDetailModal.css";

const StudentDetailModal = ({ studentId, studentName, from, to, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getStudentDetail(studentId, { from, to })
      .then((res) => {
        if (!cancelled) setDetail(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load student details.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, from, to]);

  if (!studentId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card-wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-detail-title"
      >
        <div className="modal-header">
          <h2 id="student-detail-title" className="modal-title">
            {detail?.profile?.name || studentName || "Student"}
          </h2>
          <button
            onClick={onClose}
            data-tooltip="Close Details"
            title="Close"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-400" role="status">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">{detail.profile.email}</p>
              <p className="mt-1 text-xs text-gray-400">
                Enrolled in: {detail.profile.enrolledClasses.map((c) => c.name).join(", ") || "—"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="student-detail-stat">
                <p className="student-detail-stat-label">Attendance</p>
                <p className="student-detail-stat-value">{detail.attendance.attendancePercentage}%</p>
                <p className="student-detail-stat-sub">
                  {detail.attendance.sessionsAttended} attended / {detail.attendance.sessionsMissed} missed
                </p>
              </div>
              <div className="student-detail-stat">
                <p className="student-detail-stat-label">Quiz Average</p>
                <p className="student-detail-stat-value">{detail.quizPerformance.averageScore}%</p>
                <p className="student-detail-stat-sub">{detail.quizPerformance.totalAttempted} attempts</p>
              </div>
              <div className="student-detail-stat">
                <p className="student-detail-stat-label">Highest / Lowest</p>
                <p className="student-detail-stat-value">
                  {detail.quizPerformance.highestScore}% / {detail.quizPerformance.lowestScore}%
                </p>
              </div>
              <div className="student-detail-stat">
                <p className="student-detail-stat-label">Avg Time / Session</p>
                <p className="student-detail-stat-value">{detail.engagement.avgTimeMinutes}min</p>
                <p className="student-detail-stat-sub">{detail.engagement.sessionsJoined} sessions joined</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-800">Performance Timeline</h3>
              {detail.performanceTimeline.length === 0 ? (
                <p className="text-sm text-gray-400">No quiz attempts yet in this range.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={detail.performanceTimeline}>
                    <CartesianGrid stroke={CHART_COLORS.chrome.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      tick={{ fontSize: 11, fill: CHART_COLORS.chrome.mutedText }}
                      axisLine={{ stroke: CHART_COLORS.chrome.axis }}
                      tickLine={false}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: CHART_COLORS.chrome.mutedText }} axisLine={false} tickLine={false} />
                    <Tooltip labelFormatter={formatDateLabel} formatter={(v) => [`${v}%`, "Quiz Score"]} />
                    <Line type="monotone" dataKey="quizScore" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetailModal;
