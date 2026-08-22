import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { formatDateLabel } from "../utils/dateRanges";
import { CHART_COLORS } from "../utils/chartTheme";
import ChartCard from "./ChartCard";
import "./analyticsTable.css";

const EngagementSection = ({ engagementOverview, engagementTrend, loading, onSelectStudent }) => {
  const mostActive = engagementOverview?.mostActive || [];
  const needsAttention = engagementOverview?.needsAttention || [];
  const activeCount = engagementOverview?.activeCount ?? 0;
  const inactiveCount = engagementOverview?.inactiveCount ?? 0;

  return (
    <section aria-labelledby="engagement-section-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="engagement-section-heading" className="text-lg font-bold text-gray-900">
          Engagement Overview
        </h2>
        {!loading && (
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-green-600">{activeCount} active</span>
            {" · "}
            <span className="font-semibold text-gray-400">{inactiveCount} inactive</span> this range
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Engagement Trend"
          tooltip="Engagement score = 0.6 x average attendance % + 0.4 x quiz participation %, per day."
          loading={loading}
          isEmpty={!loading && (!engagementTrend || engagementTrend.every((p) => p.value === null))}
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={engagementTrend || []}>
              <CartesianGrid stroke={CHART_COLORS.chrome.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }}
                axisLine={{ stroke: CHART_COLORS.chrome.axis }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip labelFormatter={formatDateLabel} formatter={(v) => [`${v}`, "Engagement"]} />
              <Line
                type="monotone"
                dataKey="value"
                name="Engagement"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Most Active Students"
          tooltip="Composite engagement rank based on sessions attended, time spent, and quiz participation."
          loading={loading}
          isEmpty={!loading && mostActive.length === 0}
          emptyMessage="No student activity in this range yet."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mostActive} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke={CHART_COLORS.chrome.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 12, fill: CHART_COLORS.chrome.primaryText }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value, key, item) => {
                  if (key === "engagementScore") {
                    const p = item.payload;
                    return [
                      `${value} — ${p.sessionsAttended} sessions, ${p.avgTimeMinutes}min avg, ${p.quizAttempts} quizzes`,
                      "Engagement",
                    ];
                  }
                  return [value, key];
                }}
              />
              <Bar
                dataKey="engagementScore"
                name="Engagement"
                fill={CHART_COLORS.primary}
                radius={[0, 4, 4, 0]}
                onClick={(entry) => onSelectStudent?.(entry.studentId, entry.name)}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="chart-card">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Students Needing Attention</h3>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-50" />
            ))}
          </div>
        ) : needsAttention.length === 0 ? (
          <p className="analytics-no-data">No students currently need attention.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {needsAttention.map((student) => (
              <li
                key={student.studentId}
                className="flex cursor-pointer flex-wrap items-center justify-between gap-2 py-2.5 hover:bg-gray-50"
                onClick={() => onSelectStudent?.(student.studentId, student.name)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">
                    {student.attendancePct}% attendance · {student.quizAttempts} quiz attempts
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {student.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                    >
                      <AlertTriangle size={11} aria-hidden="true" />
                      {reason}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default EngagementSection;
