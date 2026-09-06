import React, { useEffect, useState } from "react";
import { getDashboard } from "../../api/dashboard.api";

import WelcomeBanner from "../../components/WelcomeBanner/WelcomeBanner";
import StatCard from "../../components/StatCard/StatCard";
import RecentClasses from "../../components/RecentClasses/RecentClasses";
import QuickActions from "../../components/QuickActions/QuickActions";
import QuickNotes from "../../components/QuickNotes/QuickNotes";

import { Layers, Goal, CheckSquare } from "lucide-react";

import DashboardSkeleton from "../../components/DashboardSkeleton";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const [dashboard, setDashboard] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_student_dashboard");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!dashboard);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await getDashboard();
      if (response?.data) {
        setDashboard(response.data);
        localStorage.setItem(
          "cached_student_dashboard",
          JSON.stringify(response.data)
        );
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dashboard) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="student-dashboard-viewport">
      <h1 className="sr-only">Student Dashboard</h1>
      <WelcomeBanner name={dashboard?.welcomeName} role={dashboard?.role} />


      <div className="student-stats-grid">
        <StatCard
          icon={<Layers />}
          label="Enrolled Classes"
          value={dashboard?.stats?.enrolledClasses || 0}
          colorClass="bg-blue-soft"
        />

        <StatCard
          icon={<Goal />}
          label="Upcoming Quizzes"
          value={dashboard?.stats?.upcomingClasses || 0}
          colorClass="bg-purple-soft"
        />

        <StatCard
          icon={<CheckSquare />}
          label="Attendance"
          value={`${dashboard?.stats?.attendance || 0}%`}
          colorClass="bg-green-soft"
        />
      </div>

      <QuickActions />

      <div className="dashboard-split-section">
        <RecentClasses classes={dashboard?.myClasses || []} />
        <QuickNotes />
      </div>

    </div>
  );
};

export default StudentDashboard;
