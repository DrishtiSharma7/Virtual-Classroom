// frontend/src/features/assignments/pages/TeacherAssignments.jsx

import { useState } from "react";
import "./AssignmentHome.css";

const assignmentsData = [
  {
    id: 1,
    title: "React Authentication",
    classroom: "MERN Batch",
    dueDate: "30 Jul 2026",
    marks: 100,
    submissions: 18,
    totalStudents: 25,
    status: "Active",
  },
  {
    id: 2,
    title: "MongoDB Aggregation",
    classroom: "Backend Batch",
    dueDate: "02 Aug 2026",
    marks: 50,
    submissions: 12,
    totalStudents: 20,
    status: "Pending",
  },
  {
    id: 3,
    title: "JavaScript ES6",
    classroom: "Frontend Batch",
    dueDate: "05 Aug 2026",
    marks: 75,
    submissions: 20,
    totalStudents: 25,
    status: "Completed",
  },
  {
    id: 4,
    title: "Node REST API",
    classroom: "Node.js Batch",
    dueDate: "10 Aug 2026",
    marks: 100,
    submissions: 7,
    totalStudents: 22,
    status: "Active",
  },
];

export default function TeacherAssignments() {
  const [search, setSearch] = useState("");

  const filteredAssignments = assignmentsData.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(search.toLowerCase()) ||
      assignment.classroom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="assignment-page">
      {/* Header */}

      <div className="assignment-header">
        <div>
          <h1 className="assignment-title">Assignments</h1>
          <p className="assignment-subtitle">
            Manage classroom assignments and submissions.
          </p>
        </div>

        <button className="create-btn">
          + Create Assignment
        </button>
      </div>

      {/* Stats */}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Assignments</h3>
          <h2>15</h2>
        </div>

        <div className="stat-card">
          <h3>Pending Review</h3>
          <h2>8</h2>
        </div>

        <div className="stat-card">
          <h3>Submitted</h3>
          <h2>120</h2>
        </div>

        <div className="stat-card">
          <h3>Late Submissions</h3>
          <h2>12</h2>
        </div>
      </div>

      {/* Search */}

      <div className="search-section">
        <input
          type="text"
          placeholder="Search assignment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Assignment Cards */}

      <div className="assignment-grid">
        {filteredAssignments.map((assignment) => (
          <div className="assignment-card" key={assignment.id}>
            <div className="card-top">
              <div>
                <h2>{assignment.title}</h2>
                <p>{assignment.classroom}</p>
              </div>

              <span
                className={`status ${
                  assignment.status === "Completed"
                    ? "completed"
                    : assignment.status === "Pending"
                    ? "pending"
                    : "active"
                }`}
              >
                {assignment.status}
              </span>
            </div>

            <div className="card-body">
              <div>
                <strong>Due Date</strong>
                <p>{assignment.dueDate}</p>
              </div>

              <div>
                <strong>Marks</strong>
                <p>{assignment.marks}</p>
              </div>

              <div>
                <strong>Submissions</strong>
                <p>
                  {assignment.submissions}/{assignment.totalStudents}
                </p>
              </div>
            </div>

            <div className="progress-wrapper">
              <div
                className="progress-bar"
                style={{
                  width: `${
                    (assignment.submissions /
                      assignment.totalStudents) *
                    100
                  }%`,
                }}
              ></div>
            </div>

            <div className="card-buttons">
              <button className="view-btn">View</button>
              <button className="edit-btn">Edit</button>
              <button className="delete-btn">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}