import React, { useEffect, useState } from "react";
import { getDashboard } from "../../api/dashboard.api";

import WelcomeBanner from "../../components/WelcomeBanner/WelcomeBanner";
import StatCard from "../../components/StatCard/StatCard";
import RecentClasses from "../../components/RecentClasses/RecentClasses";
import QuickActions from "../../components/QuickActions/QuickActions";

import { Layers, FilePenLine, Goal, CheckSquare } from "lucide-react";

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
    <div className="dashboard-viewport">
      <WelcomeBanner name={dashboard?.welcomeName} role={dashboard?.role} />

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={<Layers />}
          label="Enrolled Classes"
          value={dashboard?.stats?.enrolledClasses || 0}
          colorClass="bg-blue-soft"
        />

        <StatCard
          icon={<FilePenLine />}
          label="Pending Assignments"
          value={0}
          colorClass="bg-orange-soft"
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
        <RecentClasses />

        <div className="activity-card">
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
