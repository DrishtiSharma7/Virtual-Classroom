import React, { useEffect, useState } from "react";
import { getDashboard } from "../../api/dashboard.api";
import WelcomeBanner from "../../components/WelcomeBanner/WelcomeBanner";
import StatCard from "../../components/StatCard/StatCard";
import RecentClasses from "../../components/RecentClasses/RecentClasses";
import RecentActivity from "../../components/RecentActivity/RecentActivity";
import QuickActions from "../../components/QuickActions/QuickActions";
import { useNavigate } from "react-router-dom";
import { createSession, startSession } from "../../../auth/api/session.api";
import { LayoutDashboard, Users, Video, CircleCheckBig } from "lucide-react";

import "./TeacherDashboard.css";

const TeacherDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await getDashboard();

      console.log("API Response:", response);

      // YEH LINE IMPORTANT HAI
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

  const handleStartSession = async () => {
    try {
      const classroom = dashboard?.recentClasses?.[0];

      console.log("Dashboard:", dashboard);
      console.log("Classroom:", classroom);

      const createResponse = await createSession({
        classroom: classroom._id,
        title: `${classroom.name} Live Session`,
        description: "Live Classroom",
        startTime: new Date(),
      });

      console.log("Create Response:", createResponse.data);

      const sessionId = createResponse.data.session._id;

      const startResponse = await startSession(sessionId);

      console.log("Start Response:", startResponse.data);

      navigate(`/live/${sessionId}`);
    } catch (err) {
      console.log("========== ERROR ==========");
      console.log(err);
      console.log("Status:", err.response?.status);
      console.log("Data:", err.response?.data);
      console.log("===========================");

      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="dashboard-viewport">
      <WelcomeBanner name={dashboard?.welcomeName} role={dashboard?.role} />

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={<LayoutDashboard />}
          label="Total Classrooms"
          value={dashboard?.stats?.totalClasses || 0}
          colorClass="bg-blue-soft"
        />

        <StatCard
          icon={<Users />}
          label="Total Students"
          value={dashboard?.stats?.totalStudents || 0}
          colorClass="bg-orange-soft"
        />

        <StatCard
          icon={<Video />}
          label="Live Sessions"
          value={dashboard?.stats?.liveSessions || 0}
          colorClass="bg-purple-soft"
        />

        <StatCard
          icon={<CircleCheckBig />}
          label="Attendance"
          value={`${dashboard?.stats?.attendance || 0}%`}
          colorClass="bg-green-soft"
        />
      </div>

      <QuickActions handleStartSession={handleStartSession} />

      {/* Recent Classes & Activity */}
      <div className="dashboard-split-section">
        <RecentClasses classes={dashboard?.recentClasses || []} />

        <div className="activity-card">
          <h3 className="section-title">Recent Activity</h3>

          {dashboard?.recentActivity?.length > 0 ? (
            <ul className="activity-list">
              {dashboard.recentActivity.map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ul>
          ) : (
            <p>No recent activity</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default TeacherDashboard;
