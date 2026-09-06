import React from "react";
import { Menu } from "lucide-react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import UserAvatar from "../../../../components/UserAvatar/UserAvatar";
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
          type="button"
          className="navbar-menu-btn cursor-pointer"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          <Menu size={24} />
        </button>

        <p className="navbar-title">{getPageTitle()}</p>
      </div>

      <div className="navbar-profile-section">
        <div className="navbar-user-card">
          <UserAvatar
            id={user?._id || user?.id}
            name={user?.name || "User"}
            size="sm"
          />
          <span className="navbar-username">{user?.name || "User"}</span>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
