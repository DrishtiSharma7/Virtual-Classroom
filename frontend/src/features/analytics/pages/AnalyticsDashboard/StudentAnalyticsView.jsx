import { useEffect, useMemo, useState } from "react";
import { RefreshCw, CalendarCheck, Trophy, Clock, Target, ChartColumn } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { getMyAnalytics } from "../../api/analytics.api";
import { resolveDateRange, formatDateLabel, DATE_PRESETS } from "../../utils/dateRanges";
import { CHART_COLORS } from "../../utils/chartTheme";
import StatCard from "../../../dashboard/components/StatCard/StatCard";
import { KpiCardSkeleton } from "../../components/Skeletons";
import ChartCard from "../../components/ChartCard";

const StudentAnalyticsView = () => {
  const [preset, setPreset] = useState("last30");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const range = useMemo(() => resolveDateRange(preset), [preset]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getMyAnalytics({ from: range.from, to: range.to })
      .then((res) => {
        if (!cancelled) setDetail(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load your analytics. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, refreshKey]);

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        <header className="analytics-header">
          <div>
            <h1 className="analytics-title">
              <ChartColumn className="analytics-title-icon" size={26} />
              My Analytics
            </h1>
            <p className="analytics-subtitle">
              Your attendance, quiz performance, and session participation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="filter-select !w-auto"
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              aria-label="Date range"
            >
              {DATE_PRESETS.filter((p) => p.key !== "custom").map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="filter-icon-btn"
              onClick={() => setRefreshKey((k) => k + 1)}
              aria-label="Refresh"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="analytics-error" role="alert">
            {error}
            <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className="analytics-error-retry">
              Retry
            </button>
          </div>
        )}

        {!loading && detail?.empty ? (
          <div className="analytics-empty-state" role="status">
            <p className="text-lg font-semibold text-gray-700">No analytics available yet.</p>
            <p className="mt-1 text-sm text-gray-500">
              Join a classroom and attend a session to see your analytics here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {loading || !detail ? (
                Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
              ) : (
                <>
                  <StatCard
                    icon={<CalendarCheck />}
                    label="Attendance"
                    value={`${detail.attendance.attendancePercentage}%`}
                    colorClass="bg-green-soft"
                    description={`${detail.attendance.sessionsAttended} attended, ${detail.attendance.sessionsMissed} missed`}
                  />
                  <StatCard
                    icon={<Trophy />}
                    label="Average Quiz Score"
                    value={`${detail.quizPerformance.averageScore}%`}
                    colorClass="bg-purple-soft"
                    description={`${detail.quizPerformance.totalAttempted} attempts`}
                  />
                  <StatCard
                    icon={<Target />}
                    label="Quiz Accuracy"
                    value={`${detail.quizPerformance.accuracy}%`}
                    colorClass="bg-blue-soft"
                  />
                  <StatCard
                    icon={<Clock />}
                    label="Avg Time / Session"
                    value={`${detail.engagement.avgTimeMinutes}min`}
                    colorClass="bg-orange-soft"
                    description={`${detail.engagement.sessionsJoined} sessions joined`}
                  />
                </>
              )}
            </div>

            <ChartCard
              title="My Quiz Performance Timeline"
              loading={loading}
              isEmpty={!loading && (!detail?.performanceTimeline || detail.performanceTimeline.length === 0)}
              emptyMessage="No quiz attempts yet in this range."
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={detail?.performanceTimeline || []}>
                  <CartesianGrid stroke={CHART_COLORS.chrome.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }}
                    axisLine={{ stroke: CHART_COLORS.chrome.axis }}
                    tickLine={false}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }} axisLine={false} tickLine={false} />
                  <Tooltip labelFormatter={formatDateLabel} formatter={(v) => [`${v}%`, "Quiz Score"]} />
                  <Line type="monotone" dataKey="quizScore" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnalyticsView;
