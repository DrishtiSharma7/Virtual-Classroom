import { useSelector } from "react-redux";

import TeacherDashboard from "./pages/TeacherDashboard/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";
import usePageMeta from "../../hooks/usePageMeta";

const Dashboard = () => {
  const { role, user } = useSelector((state) => state.auth);
  usePageMeta("Dashboard");

  const currentRole =
    role ||
    localStorage.getItem("role") ||
    user?.role ||
    JSON.parse(localStorage.getItem("user") || "null")?.role;

  const currentUser =
    user || JSON.parse(localStorage.getItem("user") || "null");

  if (!currentRole) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5b5fef] border-t-transparent" />
      </div>
    );
  }

  return currentRole === "teacher" ? (
    <TeacherDashboard user={currentUser} />
  ) : (
    <StudentDashboard user={currentUser} />
  );
};

export default Dashboard;
