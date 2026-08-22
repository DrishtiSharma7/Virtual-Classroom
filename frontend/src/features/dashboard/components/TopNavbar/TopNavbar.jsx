import { React, useState } from "react";
import { Menu, Bell, CircleUser } from "lucide-react";
import { useSelector } from "react-redux";
import "./TopNavbar.css";

const TopNavbar = ({ setSidebarOpen }) => {
  const { user, role } = useSelector((state) => state.auth);

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <button
          className="navbar-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* Not an <h1> — this bar is persistent chrome shown across several
            routes (dashboard, create classroom, join classroom), each of
            which owns its own page heading. A second "Teacher/Student
            Dashboard" <h1> here would conflict with those on every page
            that isn't actually the dashboard. */}
        <p className="navbar-title">
          {role === "teacher" ? "Teacher Dashboard" : "Student Dashboard"}
        </p>
      </div>

      <div className="navbar-profile-section">
        <button className="navbar-notification-btn" aria-label="Notifications">
          <Bell size={22} strokeWidth={2} color="black" />
        </button>

        <div className="navbar-user-card">
          <CircleUser size={36} strokeWidth={1.5} color="black" />

          <span className="navbar-username">{user?.name || "User"}</span>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
