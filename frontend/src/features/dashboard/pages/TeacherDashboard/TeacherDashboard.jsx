import React from "react";
import WelcomeBanner from "../../components/WelcomeBanner/WelcomeBanner";
import StatCard from "../../components/StatCard/StatCard";
import RecentClasses from "../../components/RecentClasses/RecentClasses";
import RecentActivity from "../../components/RecentActivity/RecentActivity";
import QuickActions from "../../components/QuickActions/QuickActions";
import {LayoutDashboard, Users, Video, CircleCheckBig} from "lucide-react";
import "./TeacherDashboard.css";

const TeacherDashboard = () => {
  return (
    <div className="dashboard-viewport">
      <WelcomeBanner />

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon={<LayoutDashboard />} label="Total Classrooms" value="5" colorClass="bg-blue-soft" />
        <StatCard icon={<Users />} label="Total Students" value="128" colorClass="bg-orange-soft" />
        <StatCard icon={<Video />} label="Live Sessions" value="2" colorClass="bg-purple-soft" />
        <StatCard icon={<CircleCheckBig />} label="Attendance" value="94%" colorClass="bg-green-soft" />
      </div>

      {/* Lower Split Sections */}
      <div className="dashboard-split-section">
        <RecentClasses />
        
        {/* Recent Activity */}
        <div className="activity-card">
          <h3 className="section-title">Recent Activity</h3>
          <ul className="activity-list">
            <li>Rahul joined Web Development</li>
            <li>Attendance marked for Data Structures</li>
            <li>Quiz created for Operating Systems</li>
            <li>New student enrolled</li>
          </ul>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div>
        <QuickActions />
      </div>
    </div>
  );
};

export default TeacherDashboard;