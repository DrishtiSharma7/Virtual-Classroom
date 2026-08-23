import { React, useState } from "react";
import { Menu, CircleUser } from "lucide-react";
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


        <p className="navbar-title">
          {role === "teacher" ? "Teacher Dashboard" : "Student Dashboard"}
        </p>
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
