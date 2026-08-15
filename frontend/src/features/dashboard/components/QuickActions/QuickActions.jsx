import React from "react";
import "./QuickActions.css";
import { useNavigate } from "react-router-dom";

function QuickActions({ handleStartSession }) {
  const navigate = useNavigate();

  return (
    <div className="quick-actions-panel">
      <h3 className="quick-actions-title">Quick Actions</h3>

      <div className="quick-actions-buttons">
        <button className="action-btn" onClick={() => navigate("/classrooms/create")}>
          Create Classroom
        </button>

        <button className="action-btn" onClick={handleStartSession}>
          Start Session
        </button>

        <button className="action-btn" onClick={() => navigate("/quizzes")}>
          Quiz
        </button>

        <button className="action-btn" onClick={() => navigate("/attendance")}>
          Attendance
        </button>
      </div>
    </div>
  );
}

export default QuickActions;
