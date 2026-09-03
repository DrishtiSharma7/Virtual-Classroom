import React from "react";
import "./QuickActions.css";
import { useNavigate } from "react-router-dom";

function QuickActions({ handleStartSession }) {
  const navigate = useNavigate();

  return (
    <div className="quick-actions-panel">
      <h3 className="quick-actions-title">Quick Actions</h3>

      <div className="quick-actions-buttons">
        <button
          className="action-btn"
          onClick={() => navigate("/classrooms/create")}
          data-tooltip="Create a new virtual classroom"
          title="Create a new virtual classroom"
        >
          Create Classroom
        </button>

        <button
          className="action-btn"
          onClick={handleStartSession}
          data-tooltip="Launch an instant live classroom session"
          title="Launch an instant live classroom session"
        >
          Start Session
        </button>

        <button
          className="action-btn"
          onClick={() => navigate("/quizzes")}
          data-tooltip="View and manage classroom quizzes"
          title="View and manage classroom quizzes"
        >
          Quiz
        </button>

        <button
          className="action-btn"
          onClick={() => navigate("/attendance")}
          data-tooltip="View and export attendance records"
          title="View and export attendance records"
        >
          Attendance
        </button>
      </div>
    </div>
  );
}

export default QuickActions;
