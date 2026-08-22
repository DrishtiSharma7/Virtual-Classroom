import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { getClassComparison } from "../api/analytics.api";
import { CHART_COLORS } from "../utils/chartTheme";
import ChartCard from "./ChartCard";
import "./analyticsTable.css";

const ClassComparisonSection = ({ from, to }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getClassComparison({ from, to })
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setSelected(new Set(res.classes.map((c) => c.classroomId)));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load class comparison.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const chartData = useMemo(
    () => (data?.classes || []).filter((c) => selected.has(c.classroomId)),
    [data, selected],
  );

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600" role="alert">
        {error}
      </div>
    );
  }

  // Only meaningful with more than one classroom — otherwise there's nothing to compare.
  if (!loading && (!data || data.classes.length <= 1)) {
    return null;
  }

  return (
    <section aria-labelledby="class-comparison-heading" className="space-y-4">
      <h2 id="class-comparison-heading" className="text-lg font-bold text-gray-900">
        Class Performance Comparison
      </h2>

      {!loading && data && (
        <div className="flex flex-wrap gap-3">
          {data.classes.map((c) => (
            <label key={c.classroomId} className="flex items-center gap-1.5 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={selected.has(c.classroomId)}
                onChange={(e) => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (e.target.checked) next.add(c.classroomId);
                    else next.delete(c.classroomId);
                    return next;
                  });
                }}
              />
              {c.name}
            </label>
          ))}
        </div>
      )}

      <ChartCard
        title="Attendance, Quiz Score & Engagement by Class"
        tooltip="All three metrics are percentages (0-100), so they're directly comparable on one chart."
        loading={loading}
        isEmpty={!loading && chartData.length === 0}
        emptyMessage="Select at least one class to compare."
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid stroke={CHART_COLORS.chrome.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }} axisLine={{ stroke: CHART_COLORS.chrome.axis }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="attendance" name="Attendance %" fill={CHART_COLORS.categorical[0]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="avgQuizScore" name="Quiz Score %" fill={CHART_COLORS.categorical[1]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="engagement" name="Engagement" fill={CHART_COLORS.categorical[2]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="chart-card">
        <div className="analytics-table-wrapper">
          <table className="analytics-table">
            <thead className="analytics-table-head">
              <tr>
                <th className="analytics-table-heading non-sortable">Class</th>
                <th className="analytics-table-heading non-sortable">Students</th>
                <th className="analytics-table-heading non-sortable">Attendance</th>
                <th className="analytics-table-heading non-sortable">Sessions</th>
                <th className="analytics-table-heading non-sortable">Avg Duration</th>
                <th className="analytics-table-heading non-sortable">Quiz Participation</th>
                <th className="analytics-table-heading non-sortable">Quiz Score</th>
                <th className="analytics-table-heading non-sortable">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {(data?.classes || []).map((c) => (
                <tr key={c.classroomId} className="analytics-table-row">
                  <td className="analytics-table-cell font-medium text-gray-900">{c.name}</td>
                  <td className="analytics-table-cell">{c.students}</td>
                  <td className="analytics-table-cell">{c.attendance}%</td>
                  <td className="analytics-table-cell">{c.sessions}</td>
                  <td className="analytics-table-cell">{c.avgSessionDurationMinutes}min</td>
                  <td className="analytics-table-cell">{c.quizParticipation}%</td>
                  <td className="analytics-table-cell">{c.avgQuizScore}%</td>
                  <td className="analytics-table-cell">{c.engagement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ClassComparisonSection;
