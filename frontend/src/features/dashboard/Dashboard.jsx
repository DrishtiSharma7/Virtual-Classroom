import { useSelector } from "react-redux";

import TeacherDashboard from "./pages/TeacherDashboard/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard/StudentDashboard";

const Dashboard = () => {
  const { role, user } = useSelector((state) => state.auth);
  if (!role) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h2>Loading...</h2>
      </div>
    );
  }

  return role === "teacher" ? (
    <TeacherDashboard user={user} />
  ) : (
    <StudentDashboard user={user} />
  );
};

export default Dashboard;
