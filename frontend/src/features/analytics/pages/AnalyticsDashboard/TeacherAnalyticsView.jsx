import { useCallback, useEffect, useMemo, useState } from "react";
import { getOverview, getAttendanceAnalytics, getSessionAnalytics, getQuizAnalytics } from "../../api/analytics.api";
import { getMyClassrooms } from "../../../classroom/api/classroom.api";
import { resolveDateRange } from "../../utils/dateRanges";
import { exportAnalyticsToExcel, exportAnalyticsToPdf } from "../../utils/analyticsExport";
import FilterBar from "../../components/FilterBar";
import KpiGrid from "../../components/KpiGrid";
import InsightsPanel from "../../components/InsightsPanel";
import AttendanceSection from "../../components/AttendanceSection";
import EngagementSection from "../../components/EngagementSection";
import SessionSection from "../../components/SessionSection";
import QuizSection from "../../components/QuizSection";
import ClassComparisonSection from "../../components/ClassComparisonSection";
import PerformanceTrendsSection from "../../components/PerformanceTrendsSection";
import StudentDetailModal from "../../components/StudentDetailModal";

const TeacherAnalyticsView = () => {
  const [preset, setPreset] = useState("last30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [classroomId, setClassroomId] = useState("all");
  const [classrooms, setClassrooms] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const range = useMemo(
    () => resolveDateRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  useEffect(() => {
    getMyClassrooms()
      .then((res) => setClassrooms(res.classrooms || res))
      .catch(() => setClassrooms([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingOverview(true);
    setError("");
    getOverview({ classroomId, from: range.from, to: range.to })
      .then((res) => {
        if (!cancelled) setOverview(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load analytics. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOverview(false);
          setRefreshing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [classroomId, range.from, range.to, refreshKey]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
  }, []);

  const scopeLabel =
    classroomId === "all"
      ? "All Classes"
      : classrooms.find((c) => c._id === classroomId)?.name || "Class";
  const dateRangeLabel = `${new Date(range.from).toLocaleDateString()} - ${new Date(range.to).toLocaleDateString()}`;

  const handleExportCsv = async () => {
    try {
      const [attendance, sessions, quizzes] = await Promise.all([
        getAttendanceAnalytics({ classroomId, from: range.from, to: range.to, limit: 1000 }),
        getSessionAnalytics({ classroomId, from: range.from, to: range.to, limit: 1000 }),
        getQuizAnalytics({ classroomId, from: range.from, to: range.to, limit: 1000 }),
      ]);
      exportAnalyticsToExcel({
        scopeLabel,
        dateRangeLabel,
        kpis: overview?.kpis || [],
        attendanceRows: attendance.table.rows,
        sessionRows: sessions.table.rows,
        quizRankingRows: quizzes.studentRanking.rows,
      });
    } catch {
      setError("Unable to export analytics. Please try again.");
    }
  };

  const handleExportPdf = async () => {
    try {
      const [attendance, sessions] = await Promise.all([
        getAttendanceAnalytics({ classroomId, from: range.from, to: range.to, limit: 1000 }),
        getSessionAnalytics({ classroomId, from: range.from, to: range.to, limit: 1000 }),
      ]);
      exportAnalyticsToPdf({
        scopeLabel,
        dateRangeLabel,
        kpis: overview?.kpis || [],
        insights: overview?.insights || [],
        attendanceRows: attendance.table.rows,
        sessionRows: sessions.table.rows,
      });
    } catch {
      setError("Unable to export analytics. Please try again.");
    }
  };

  const hasNoData =
    !loadingOverview &&
    overview &&
    overview.kpis.every((k) => !k.value) &&
    overview.engagementOverview.activeCount === 0 &&
    overview.engagementOverview.inactiveCount === 0;

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        <header className="analytics-header">
          <div>
            <h1 className="analytics-title">Analytics</h1>
            <p className="analytics-subtitle">
              Track classroom engagement, attendance, session activity, and student performance.
            </p>
          </div>
        </header>

        <FilterBar
          preset={preset}
          onPresetChange={setPreset}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
          classrooms={classrooms}
          classroomId={classroomId}
          onClassroomChange={setClassroomId}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
        />

        {error && (
          <div className="analytics-error" role="alert">
            {error}
            <button type="button" onClick={handleRefresh} className="analytics-error-retry">
              Retry
            </button>
          </div>
        )}

        {hasNoData ? (
          <div className="analytics-empty-state" role="status">
            <p className="text-lg font-semibold text-gray-700">No analytics available yet.</p>
            <p className="mt-1 text-sm text-gray-500">
              Start a classroom session to generate analytics.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <KpiGrid kpis={overview?.kpis} loading={loadingOverview} />

            <InsightsPanel insights={overview?.insights || []} loading={loadingOverview} />

            <AttendanceSection
              classroomId={classroomId}
              from={range.from}
              to={range.to}
              onSelectStudent={(id, name) => setSelectedStudent({ id, name })}
            />

            <EngagementSection
              engagementOverview={overview?.engagementOverview}
              engagementTrend={overview?.performanceTrends?.engagement}
              loading={loadingOverview}
              onSelectStudent={(id, name) => setSelectedStudent({ id, name })}
            />

            <SessionSection classroomId={classroomId} from={range.from} to={range.to} />

            <QuizSection classroomId={classroomId} from={range.from} to={range.to} />

            <ClassComparisonSection from={range.from} to={range.to} />

            <PerformanceTrendsSection
              performanceTrends={overview?.performanceTrends}
              loading={loadingOverview}
            />
          </div>
        )}
      </div>

      <StudentDetailModal
        studentId={selectedStudent?.id}
        studentName={selectedStudent?.name}
        from={range.from}
        to={range.to}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
};

export default TeacherAnalyticsView;
