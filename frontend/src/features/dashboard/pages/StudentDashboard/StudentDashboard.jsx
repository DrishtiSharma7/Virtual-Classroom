/*import "./StudentDashboard.css";

import WelcomeBanner from "../../components/WelcomeBanner/WelcomeBanner";
import StatCard from "../../components/StatCard/StatCard";
import RecentClasses from "../../components/RecentClasses/RecentClasses";
import RecentActivity from "../../components/RecentActivity/RecentActivity";
import QuickActions from "../../components/QuickActions/QuickActions";

import {
  BookOpen,
  ClipboardList,
  FileQuestion,
  CircleCheckBig,
} from "lucide-react";

import { studentDashboardData } from "../../data/studentDashboardData";

function StudentDashboard() {
  const stats = [
    {
      title: "Enrolled Classes",
      value: studentDashboardData.stats.enrolledClasses,
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Pending Assignments",
      value: studentDashboardData.stats.pendingAssignments,
      icon: ClipboardList,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Upcoming Quizzes",
      value: studentDashboardData.stats.upcomingQuizzes,
      icon: FileQuestion,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Attendance",
      value: `${studentDashboardData.stats.attendance}%`,
      icon: CircleCheckBig,
      color: "bg-green-100 text-green-600",
    },
  ];

  return (
    <div className="student-dashboard">

      <WelcomeBanner type="student" />

      <section className="stats-grid">
        {stats.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            Icon={item.icon}
            colorClass={item.color}
          />
        ))}
      </section>

      <section className="dashboard-bottom">

        <RecentClasses
          title="My Classes"
          classes={studentDashboardData.myClasses}
          student
        />

        <RecentActivity
          activities={studentDashboardData.recentActivity}
        />

      </section>

      <QuickActions type="student" />

    </div>
  );
};

export default StudentDashboard;*/

import React from "react";
import WelcomeBanner from "../../components/WelcomeBanner/WelcomeBanner";
import StatCard from "../../components/StatCard/StatCard";
import RecentClasses from "../../components/RecentClasses/RecentClasses";
import RecentActivity from "../../components/RecentActivity/RecentActivity";
import QuickActions from "../../components/QuickActions/QuickActions";
import {Layers,
  FilePenLine,
  Goal,
  CheckSquare,} from "lucide-react";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  return (
    <div className="dashboard-viewport">
      <WelcomeBanner />

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon={<Layers />} label="Enrolled Classes" value="5" colorClass="bg-blue-soft" />
        <StatCard icon={<FilePenLine />} label="Pending Assignments" value="128" colorClass="bg-orange-soft" />
        <StatCard icon={<Goal />} label="Upcoming Quizzes" value="2" colorClass="bg-purple-soft" />
        <StatCard icon={<CheckSquare />} label="Attendance" value="94%" colorClass="bg-green-soft" />
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

export default StudentDashboard;