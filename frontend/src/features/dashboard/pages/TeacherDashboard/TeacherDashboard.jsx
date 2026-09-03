import React, { useEffect, useState } from "react";
import { getDashboard } from "../../api/dashboard.api";
import WelcomeBanner from "../../components/WelcomeBanner/WelcomeBanner";
import StatCard from "../../components/StatCard/StatCard";
import RecentClasses from "../../components/RecentClasses/RecentClasses";
import QuickActions from "../../components/QuickActions/QuickActions";
import { useNavigate } from "react-router-dom";
import { createSession, startSession, getSessionsByClassroom } from "../../../auth/api/session.api";
import { LayoutDashboard, Users, Video, CircleCheckBig } from "lucide-react";
import toast from "react-hot-toast";

import DashboardSkeleton from "../../components/DashboardSkeleton";
import "./TeacherDashboard.css";

const TeacherDashboard = () => {
  const [dashboard, setDashboard] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_teacher_dashboard");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!dashboard);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await getDashboard();
      if (response?.data) {
        setDashboard(response.data);
        localStorage.setItem(
          "cached_teacher_dashboard",
          JSON.stringify(response.data)
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dashboard) {
    return <DashboardSkeleton />;
  }

  const handleStartSession = async () => {
    try {
      const classroom = dashboard?.recentClasses?.[0];
      if (!classroom) {
        toast.error("No classroom found. Please create one first.");
        return;
      }

      // Check if this classroom already has an active live session
      const sessionsRes = await getSessionsByClassroom(classroom._id);
      const existingLive = sessionsRes.data?.find((s) => s.status === "live");

      if (existingLive) {
        toast.success("Rejoining your active live session...");
        navigate(`/live/${existingLive._id}`);
        return;
      }

      const createResponse = await createSession({
        classroom: classroom._id,
        title: `${classroom.name} Live Session`,
        description: "Live Classroom",
        startTime: new Date(),
      });

      const session = createResponse.data.session;
      if (!createResponse.data.alreadyLive) {
        await startSession(session._id);
      }

      navigate(`/live/${session._id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="teacher-dashboard-viewport">
      <h1 className="sr-only">Teacher Dashboard</h1>
      <WelcomeBanner name={dashboard?.welcomeName} role={dashboard?.role} />


      <div className="teacher-stats-grid">
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


      <div className="dashboard-split-section">
        <RecentClasses classes={dashboard?.recentClasses || []} />

        <div className="teacher-activity-card">
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
