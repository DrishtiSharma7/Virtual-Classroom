import React from "react";
import { Menu, CircleUser } from "lucide-react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import "./TopNavbar.css";

const TopNavbar = ({ setSidebarOpen }) => {
  const { user, role } = useSelector((state) => state.auth);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/classrooms/create")) return "Create Classroom";
    if (path.startsWith("/classrooms/join")) return "Join Classroom";
    if (path.startsWith("/classrooms/")) return "Classroom Details";
    if (path.startsWith("/classrooms")) return "Classrooms";
    if (path.startsWith("/attendance")) return "Attendance";
    if (path.startsWith("/quizzes")) return "Quizzes";
    if (path.startsWith("/recordings")) return "Recordings";
    if (path.startsWith("/analytics")) return "Analytics";
    if (path.startsWith("/settings")) return "Settings";
    return role === "teacher" ? "Teacher Dashboard" : "Student Dashboard";
  };

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <button
          className="navbar-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          data-tooltip="Open navigation menu"
          title="Open navigation menu"
        >
          <Menu size={24} />
        </button>

        <p className="navbar-title">{getPageTitle()}</p>
      </div>

      <div className="navbar-profile-section">
        <div className="navbar-user-card">
          <CircleUser size={36} strokeWidth={1.5} color="black" />
          <span className="navbar-username">{user?.name || "User"}</span>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
