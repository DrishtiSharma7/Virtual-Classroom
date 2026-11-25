import { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import usePageMeta from "../../../../hooks/usePageMeta";
import "./AnalyticsDashboard.css";

const TeacherAnalyticsView = lazy(() => import("./TeacherAnalyticsView"));
const StudentAnalyticsView = lazy(() => import("./StudentAnalyticsView"));

function AnalyticsLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5b5fef] border-t-transparent" />
    </div>
  );
}

const AnalyticsDashboard = () => {
  usePageMeta(
    "Analytics",
    "Track classroom engagement, attendance, session activity, and student performance.",
  );
  const { role } = useSelector((state) => state.auth);

  return (
    <Suspense fallback={<AnalyticsLoading />}>
      {role === "teacher" ? <TeacherAnalyticsView /> : <StudentAnalyticsView />}
    </Suspense>
  );
};

export default AnalyticsDashboard;
