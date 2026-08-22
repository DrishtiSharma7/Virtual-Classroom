import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Search } from "lucide-react";
import { getAttendanceAnalytics } from "../api/analytics.api";
import { formatDateLabel } from "../utils/dateRanges";
import { CHART_COLORS } from "../utils/chartTheme";
import useDebouncedValue from "../hooks/useDebouncedValue";
import ChartCard from "./ChartCard";
import StatusBadge from "./StatusBadge";
import Pagination from "./Pagination";
import { TableRowsSkeleton } from "./Skeletons";
import "./analyticsTable.css";

const STATUS_OPTIONS = ["Excellent", "Good", "Needs Attention", "Critical"];

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-gray-700">{formatDateLabel(label)}</p>
      <p className="text-gray-600">Present: {point.present}</p>
      <p className="text-gray-600">Absent: {point.absent}</p>
      <p className="text-gray-600">Attendance: {point.attendancePercentage}%</p>
    </div>
  );
}

const AttendanceSection = ({ classroomId, from, to, onSelectStudent }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("attendancePercentage");
  const [order, setOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [classroomId, from, to, debouncedSearch, status]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getAttendanceAnalytics({
      classroomId,
      from,
      to,
      page,
      limit: 8,
      sort,
      order,
      search: debouncedSearch,
      status,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to load attendance analytics.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classroomId, from, to, page, sort, order, debouncedSearch, status]);

  const toggleSort = (field) => {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("desc");
    }
  };

  const distribution = data?.distribution;
  const donutData = distribution
    ? [
        { name: "Present", value: distribution.present, color: CHART_COLORS.status.good },
        { name: "Low Attendance", value: distribution.lowAttendance, color: CHART_COLORS.status.warning },
        { name: "Absent", value: distribution.absent, color: CHART_COLORS.status.critical },
      ].filter((d) => d.value > 0)
    : [];

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600" role="alert">
        {error}
      </div>
    );
  }

  return (
    <section aria-labelledby="attendance-section-heading" className="space-y-4">
      <h2 id="attendance-section-heading" className="text-lg font-bold text-gray-900">
        Attendance Overview
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Attendance Trend"
            tooltip="Present and absent counts per session day. Hover a point for the day's attendance %."
            loading={loading}
            isEmpty={!loading && (!data?.trend || data.trend.length === 0)}
            emptyMessage="No sessions in this range yet."
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data?.trend || []}>
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
                  allowDecimals={false}
                />
                <Tooltip content={<TrendTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stackId="1"
                  stroke={CHART_COLORS.status.good}
                  fill={CHART_COLORS.status.good}
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="absent"
                  name="Absent"
                  stackId="1"
                  stroke={CHART_COLORS.status.critical}
                  fill={CHART_COLORS.status.critical}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard
          title="Attendance Distribution"
          tooltip="Students bucketed by their overall attendance % this range: Present (Good/Excellent), Low Attendance (Needs Attention), Absent (Critical)."
          loading={loading}
          isEmpty={!loading && donutData.length === 0}
          emptyMessage="No attendance data yet."
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
              >
                {donutData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="chart-card">
        <div className="analytics-table-toolbar">
          <h3 className="text-sm font-semibold text-gray-800">Student Attendance Ranking</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="analytics-search-wrapper">
              <Search size={15} className="analytics-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="analytics-search-input"
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search students"
              />
            </div>
            <select
              className="filter-select !w-auto"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by attendance status"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="analytics-table-wrapper">
          <table className="analytics-table">
            <thead className="analytics-table-head">
              <tr>
                <th className="analytics-table-heading" onClick={() => toggleSort("name")}>
                  Student
                </th>
                <th className="analytics-table-heading non-sortable">Sessions</th>
                <th className="analytics-table-heading non-sortable">Present</th>
                <th className="analytics-table-heading non-sortable">Absent</th>
                <th className="analytics-table-heading" onClick={() => toggleSort("attendancePercentage")}>
                  Attendance %
                </th>
                <th className="analytics-table-heading non-sortable">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowsSkeleton rows={5} columns={6} />
              ) : data?.table?.rows?.length ? (
                data.table.rows.map((row) => (
                  <tr
                    key={row.studentId}
                    className="analytics-table-row cursor-pointer"
                    onClick={() => onSelectStudent?.(row.studentId, row.name)}
                  >
                    <td className="analytics-table-cell font-medium text-gray-900">{row.name}</td>
                    <td className="analytics-table-cell">{row.sessions}</td>
                    <td className="analytics-table-cell">{row.present}</td>
                    <td className="analytics-table-cell">{row.absent}</td>
                    <td className="analytics-table-cell">{row.attendancePercentage}%</td>
                    <td className="analytics-table-cell">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="analytics-no-data">
                    No students match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.table && (
          <Pagination
            page={data.table.page}
            limit={data.table.limit}
            total={data.table.total}
            onPageChange={setPage}
          />
        )}
      </div>
    </section>
  );
};

export default AttendanceSection;
