import React from "react";
import { GraduationCap } from "lucide-react";
import "./WelcomeBanner.css";

const WelcomeBanner = ({ name, role }) => {
  return (
    <div className="banner-container">
      <GraduationCap className="banner-watermark" aria-hidden="true" />

      <div className="banner-content">
        <h2 className="banner-heading">Welcome back, {name || "User"}! 👋</h2>

        <p className="banner-subtext">
          {role === "teacher"
            ? "Manage your classrooms, students, and live sessions from one place."
            : "Continue learning, join your classes, and track your progress."}
        </p>
      </div>

      <div className="banner-illustration" aria-hidden="true">
        <div className="banner-cap-card">
          <GraduationCap className="banner-cap-icon" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
