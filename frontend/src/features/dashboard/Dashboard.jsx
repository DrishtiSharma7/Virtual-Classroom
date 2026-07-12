import TeacherDashboard from "./pages/TeacherDashboard/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user?.role === "teacher") {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
};

export default Dashboard;