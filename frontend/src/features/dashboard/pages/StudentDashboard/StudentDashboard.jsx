import React, { useEffect, useState } from "react";
import { getDashboard } from "../../api/dashboard.api";

import WelcomeBanner from "../../components/WelcomeBanner/WelcomeBanner";
import StatCard from "../../components/StatCard/StatCard";
import RecentClasses from "../../components/RecentClasses/RecentClasses";
import QuickActions from "../../components/QuickActions/QuickActions";

import { Layers, Goal, CheckSquare } from "lucide-react";

import "./StudentDashboard.css";

const StudentDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await getDashboard();
      setDashboard(response.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading...</h2>;
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

        <div className="student-activity-card">
          <h3 className="section-title">Recent Activity</h3>

          <ul className="activity-list">
            <li>No recent activity</li>
          </ul>
        </div>
      </div>

    </div>
  );
};

export default StudentDashboard;
