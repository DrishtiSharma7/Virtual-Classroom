import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatDateLabel } from "../utils/dateRanges";
import { CHART_COLORS } from "../utils/chartTheme";
import { regroupTrend } from "../utils/regroupTrend";
import ChartCard from "./ChartCard";

const METRICS = [
  { key: "attendance", label: "Attendance", suffix: "%" },
  { key: "quizScore", label: "Quiz Score", suffix: "%" },
  { key: "engagement", label: "Engagement", suffix: "" },
  { key: "participation", label: "Participation", suffix: "%" },
  { key: "sessionActivity", label: "Session Activity", suffix: "" },
];

const GRANULARITIES = [
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

const PerformanceTrendsSection = ({ performanceTrends, loading }) => {
  const [metric, setMetric] = useState("attendance");
  const [granularity, setGranularity] = useState("day");

  const regrouped = useMemo(() => {
    const series = performanceTrends?.[metric] || [];
    return regroupTrend(series, granularity, { sum: metric === "sessionActivity" });
  }, [performanceTrends, granularity, metric]);
  const activeMetric = METRICS.find((m) => m.key === metric);

  return (
    <section aria-labelledby="performance-trends-heading" className="space-y-3">
      <h2 id="performance-trends-heading" className="text-lg font-bold text-gray-900">
        Performance Trends
      </h2>

      <ChartCard
        title={`${activeMetric.label} over time`}
        loading={loading}
        isEmpty={!loading && regrouped.every((p) => p.value === null || p.value === undefined)}
        height={320}
        actions={
          <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
            {GRANULARITIES.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setGranularity(g.key)}
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  granularity === g.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                metric === m.key
                  ? "bg-[#5b5fef] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              aria-pressed={metric === m.key}
            >
              {m.label}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={regrouped}>
            <CartesianGrid stroke={CHART_COLORS.chrome.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={granularity === "month" ? undefined : formatDateLabel}
              tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }}
              axisLine={{ stroke: CHART_COLORS.chrome.axis }}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }} axisLine={false} tickLine={false} />
            <Tooltip
              labelFormatter={granularity === "month" ? undefined : formatDateLabel}
              formatter={(v) => [`${v}${activeMetric.suffix}`, activeMetric.label]}
            />
            <Line
              type="monotone"
              dataKey="value"
              name={activeMetric.label}
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
};

export default PerformanceTrendsSection;
