import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Search, ClipboardList, Target, Trophy, CheckCircle2 } from "lucide-react";
import { getQuizAnalytics } from "../api/analytics.api";
import { formatDateLabel } from "../utils/dateRanges";
import { CHART_COLORS } from "../utils/chartTheme";
import useDebouncedValue from "../hooks/useDebouncedValue";
import ChartCard from "./ChartCard";
import StatCard from "../../dashboard/components/StatCard/StatCard";
import StatusBadge from "./StatusBadge";
import Pagination from "./Pagination";
import { TableRowsSkeleton, KpiCardSkeleton } from "./Skeletons";
import "./analyticsTable.css";

const QuizSection = ({ classroomId, from, to }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("averageScore");
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
    getQuizAnalytics({
      classroomId,
      from,
      to,
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
          setError(err.response?.data?.message || "Unable to load quiz analytics.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classroomId, from, to, page, sort, order, debouncedSearch]);

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
    <section aria-labelledby="quiz-section-heading" className="space-y-4">
      <h2 id="quiz-section-heading" className="text-lg font-bold text-gray-900">
        Quiz Performance
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {loading || !kpis ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={<ClipboardList />} label="Total Quizzes" value={kpis.totalQuizzes} colorClass="bg-blue-soft" />
            <StatCard icon={<Target />} label="Total Attempts" value={kpis.totalAttempts} colorClass="bg-orange-soft" />
            <StatCard icon={<Trophy />} label="Average Score" value={`${kpis.averageScore}%`} colorClass="bg-purple-soft" />
            <StatCard icon={<CheckCircle2 />} label="Average Accuracy" value={`${kpis.averageAccuracy}%`} colorClass="bg-green-soft" />
          </>
        )}
      </div>
      {!loading && kpis && (
        <p className="text-xs text-gray-400">
          Highest: {kpis.highestScore}% · Lowest: {kpis.lowestScore}% · Avg completion rate: {kpis.averageCompletionRate}%
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Quiz Performance Trend"
          tooltip="Average score % per quiz, ordered by when the quiz was created."
          loading={loading}
          isEmpty={!loading && (!data?.scoreTrend || data.scoreTrend.length === 0)}
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data?.scoreTrend || []}>
              <CartesianGrid stroke={CHART_COLORS.chrome.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }}
                axisLine={{ stroke: CHART_COLORS.chrome.axis }}
                tickLine={false}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={formatDateLabel} formatter={(v) => [`${v}%`, "Avg Score"]} />
              <Line type="monotone" dataKey="value" name="Avg Score" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Quiz Comparison"
          tooltip="Average score, participation, and accuracy per quiz (all on a 0-100% scale)."
          loading={loading}
          isEmpty={!loading && (!data?.comparison || data.comparison.length === 0)}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.comparison || []}>
              <CartesianGrid stroke={CHART_COLORS.chrome.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="title"
                tick={{ fontSize: 11, fill: CHART_COLORS.chrome.mutedText }}
                axisLine={{ stroke: CHART_COLORS.chrome.axis }}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: CHART_COLORS.chrome.mutedText }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="averageScore" name="Avg Score %" fill={CHART_COLORS.categorical[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="participation" name="Participation %" fill={CHART_COLORS.categorical[1]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="accuracy" name="Accuracy %" fill={CHART_COLORS.categorical[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="chart-card">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Question Difficulty Analysis</h3>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-gray-50" />
            ))}
          </div>
        ) : !data?.questionDifficulty?.length ? (
          <p className="analytics-no-data">No quiz questions answered in this range yet.</p>
        ) : (
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead className="analytics-table-head">
                <tr>
                  <th className="analytics-table-heading non-sortable">Question</th>
                  <th className="analytics-table-heading non-sortable">Correct %</th>
                  <th className="analytics-table-heading non-sortable">Incorrect %</th>
                  <th className="analytics-table-heading non-sortable">Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {data.questionDifficulty.map((q, i) => (
                  <tr key={i} className="analytics-table-row">
                    <td className="analytics-table-cell max-w-xs truncate" title={q.question}>
                      {q.question}
                    </td>
                    <td className="analytics-table-cell">{q.correctPct}%</td>
                    <td className="analytics-table-cell">{q.incorrectPct}%</td>
                    <td className="analytics-table-cell">
                      <StatusBadge status={q.difficulty} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="chart-card">
        <div className="analytics-table-toolbar">
          <h3 className="text-sm font-semibold text-gray-800">Student Quiz Ranking</h3>
          <div className="analytics-search-wrapper">
            <Search size={15} className="analytics-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="analytics-search-input"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search students in quiz ranking"
            />
          </div>
        </div>

        <div className="analytics-table-wrapper">
          <table className="analytics-table">
            <thead className="analytics-table-head">
              <tr>
                <th className="analytics-table-heading non-sortable">Rank</th>
                <th className="analytics-table-heading non-sortable">Student</th>
                <th className="analytics-table-heading" onClick={() => toggleSort("attempts")}>Attempts</th>
                <th className="analytics-table-heading" onClick={() => toggleSort("averageScore")}>Average Score</th>
                <th className="analytics-table-heading" onClick={() => toggleSort("accuracy")}>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowsSkeleton rows={5} columns={5} />
              ) : data?.studentRanking?.rows?.length ? (
                data.studentRanking.rows.map((row) => (
                  <tr key={row.studentId} className="analytics-table-row">
                    <td className="analytics-table-cell">#{row.rank}</td>
                    <td className="analytics-table-cell font-medium text-gray-900">{row.name}</td>
                    <td className="analytics-table-cell">{row.attempts}</td>
                    <td className="analytics-table-cell">{row.averageScore}%</td>
                    <td className="analytics-table-cell">{row.accuracy}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="analytics-no-data">
                    Quiz analytics will appear after students attempt a quiz.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.studentRanking && (
          <Pagination
            page={data.studentRanking.page}
            limit={data.studentRanking.limit}
            total={data.studentRanking.total}
            onPageChange={setPage}
          />
        )}
      </div>
    </section>
  );
};

export default QuizSection;
