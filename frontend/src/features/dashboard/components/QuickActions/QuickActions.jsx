import React from "react";
import "./QuickActions.css";

function QuickActions({ handleStartSession }) {
  return (
    <div className="quick-actions-panel">
      <h3 className="quick-actions-title">Quick Actions</h3>

      <div className="quick-actions-buttons">
        <button className="action-btn">Create Classroom</button>

        <button className="action-btn" onClick={handleStartSession}>
          Start Session
        </button>

        <button className="action-btn">Create Quiz</button>
        <button className="action-btn">Mark Attendance</button>
      </div>
    </div>
  );
}

export default QuickActions;
