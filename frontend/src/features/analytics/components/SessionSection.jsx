import { useEffect, useState } from "react";
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
import { Search, Video, Clock, Users, Gauge } from "lucide-react";
import { getSessionAnalytics } from "../api/analytics.api";
import { CHART_COLORS } from "../utils/chartTheme";
import useDebouncedValue from "../hooks/useDebouncedValue";
import ChartCard from "./ChartCard";
import StatCard from "../../dashboard/components/StatCard/StatCard";
import Pagination from "./Pagination";
import { TableRowsSkeleton, KpiCardSkeleton } from "./Skeletons";
import "./analyticsTable.css";

const GROUP_OPTIONS = [
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

const SessionSection = ({ classroomId, from, to }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("date");
  const [order, setOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [classroomId, from, to, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getSessionAnalytics({
      classroomId,
      from,
      to,
      groupBy,
      page,
      limit: 8,
      sort,
      order,
      search: debouncedSearch,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load session analytics.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classroomId, from, to, groupBy, page, sort, order, debouncedSearch]);

  const toggleSort = (field) => {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("desc");
    }
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600" role="alert">
        {error}
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <section aria-labelledby="session-section-heading" className="space-y-4">
      <h2 id="session-section-heading" className="text-lg font-bold text-gray-900">
        Live Session Analytics
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {loading || !kpis ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={<Video />} label="Total Sessions" value={kpis.totalSessions} colorClass="bg-blue-soft" />
            <StatCard icon={<Clock />} label="Avg Duration" value={`${kpis.avgDurationMinutes}m`} colorClass="bg-orange-soft" />
            <StatCard icon={<Users />} label="Avg Participants" value={kpis.avgParticipants} colorClass="bg-purple-soft" />
            <StatCard icon={<Gauge />} label="Peak Participants" value={kpis.peakParticipants} colorClass="bg-green-soft" />
          </>
        )}
      </div>
      {!loading && kpis && (
        <p className="text-xs text-gray-400">
          Longest session: {kpis.longestDurationMinutes}m · Shortest: {kpis.shortestDurationMinutes}m
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Session Activity"
          tooltip="Number of completed sessions per period."
          loading={loading}
          isEmpty={!loading && (!data?.activityChart || data.activityChart.length === 0)}
          actions={
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
              {GROUP_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setGroupBy(opt.key)}
                  data-tooltip={`Group session activity by ${opt.label.toLowerCase()}`}
                  title={opt.label}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    groupBy === opt.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.activityChart || []}>
              <CartesianGrid stroke={CHART_COLORS.chrome.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }}
                axisLine={{ stroke: CHART_COLORS.chrome.axis }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip />
              <Bar dataKey="count" name="Sessions" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Session Duration"
          tooltip="Average session duration (minutes) per period."
          loading={loading}
          isEmpty={!loading && (!data?.durationTrend || data.durationTrend.length === 0)}
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.durationTrend || []}>
              <CartesianGrid stroke={CHART_COLORS.chrome.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }}
                axisLine={{ stroke: CHART_COLORS.chrome.axis }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(v) => [`${v} min`, "Avg Duration"]} />
              <Line
                type="monotone"
                dataKey="avgDurationMinutes"
                name="Avg Duration"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="chart-card">
        <div className="analytics-table-toolbar">
          <h3 className="text-sm font-semibold text-gray-800">Session History</h3>
          <div className="analytics-search-wrapper">
            <Search size={15} className="analytics-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="analytics-search-input"
              placeholder="Search class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search sessions by class"
            />
          </div>
        </div>

        <div className="analytics-table-wrapper">
          <table className="analytics-table">
            <thead className="analytics-table-head">
              <tr>
                <th className="analytics-table-heading" onClick={() => toggleSort("date")}>Date</th>
                <th className="analytics-table-heading" onClick={() => toggleSort("classroom")}>Class</th>
                <th className="analytics-table-heading" onClick={() => toggleSort("durationMinutes")}>Duration</th>
                <th className="analytics-table-heading" onClick={() => toggleSort("studentsJoined")}>Students Joined</th>
                <th className="analytics-table-heading" onClick={() => toggleSort("attendancePercentage")}>Attendance %</th>
                <th className="analytics-table-heading non-sortable">Quiz</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowsSkeleton rows={5} columns={6} />
              ) : data?.table?.rows?.length ? (
                data.table.rows.map((row) => (
                  <tr key={row.sessionId} className="analytics-table-row">
                    <td className="analytics-table-cell">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="analytics-table-cell font-medium text-gray-900">{row.classroom}</td>
                    <td className="analytics-table-cell">{row.durationMinutes}min</td>
                    <td className="analytics-table-cell">{row.studentsJoined}</td>
                    <td className="analytics-table-cell">{row.attendancePercentage}%</td>
                    <td className="analytics-table-cell">{row.hasQuiz ? "Yes" : "No"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="analytics-no-data">
                    No sessions found for this range. Session analytics will appear once you conduct your first session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.table && (
          <Pagination page={data.table.page} limit={data.table.limit} total={data.table.total} onPageChange={setPage} />
        )}
      </div>
    </section>
  );
};

export default SessionSection;
