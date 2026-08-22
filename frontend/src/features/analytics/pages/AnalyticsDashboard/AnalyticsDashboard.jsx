import { useSelector } from "react-redux";
import usePageMeta from "../../../../hooks/usePageMeta";
import TeacherAnalyticsView from "./TeacherAnalyticsView";
import StudentAnalyticsView from "./StudentAnalyticsView";
import "./AnalyticsDashboard.css";

const AnalyticsDashboard = () => {
  usePageMeta(
    "Analytics",
    "Track classroom engagement, attendance, session activity, and student performance.",
  );
  const { role } = useSelector((state) => state.auth);

  return role === "teacher" ? <TeacherAnalyticsView /> : <StudentAnalyticsView />;
};

export default AnalyticsDashboard;
