/*import { useSelector } from "react-redux";
import { FaChalkboardTeacher } from "react-icons/fa";
import "./WelcomeBanner.css";

const WelcomeBanner = () => {
    const auth = useSelector((state) => state.auth);

console.log(auth);
  const { user } = useSelector((state) => state.auth);

  return (
    <section className="welcome-banner">

      <div className="welcome-content">
        <h1>
          Welcome back,
          <span> {user?.name || "Teacher"} 👋</span>
        </h1>

        <p>
          Manage your classrooms, students, quizzes and live sessions from one place.
        </p>

        <button className="welcome-btn">
          <FaChalkboardTeacher />
          Create Classroom
        </button>
      </div>

      <div className="welcome-image">
        <div className="circle">
          🎓
        </div>
      </div>

    </section>
  );
};

export default WelcomeBanner;*/

import React from 'react';
import './WelcomeBanner.css';

const WelcomeBanner = () => {
  return (
    <div className="banner-container">
      <div className="banner-content">
        <h2 className="banner-heading">Welcome back, Sarah! 👋</h2>
        <p className="banner-subtext">Manage your classrooms, students, and live sessions from one place.</p>
        <button className="banner-btn">Create Classroom</button>
      </div>
      <div className="banner-illustration">
        <span className="text-7xl opacity-80">🎓</span>
      </div>
    </div>
  );
};

export default WelcomeBanner;