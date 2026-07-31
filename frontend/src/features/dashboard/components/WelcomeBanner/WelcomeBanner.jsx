import React from "react";
import "./WelcomeBanner.css";

const WelcomeBanner = ({ name, role }) => {
  return (
    <div className="banner-container">
      <div className="banner-content">
        <h2 className="banner-heading">Welcome back, {name || "User"}! 👋</h2>

        <p className="banner-subtext">
          {role === "teacher"
            ? "Manage your classrooms, students, and live sessions from one place."
            : "Continue learning, join your classes, and track your progress."}
        </p>
      </div>
      <div className="banner-illustration">
        <span className="text-7xl opacity-80">🎓</span>
      </div>
    </div>
  );
};

export default WelcomeBanner;
