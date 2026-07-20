import React from "react";
import "./RecentClasses.css";

const RecentClasses = () => {
  const classes = [
    {
      name: "Data Structures",
      subject: "Computer Science",
      students: "35 Students",
      status: "Active",
      statusStyle: "status-active",
    },
    {
      name: "Web Development",
      subject: "Computer Science",
      students: "42 Students",
      status: "Upcoming",
      statusStyle: "status-upcoming",
    },
    {
      name: "Operating Systems",
      subject: "Computer Science",
      students: "30 Students",
      status: "Completed",
      statusStyle: "status-completed",
    },
  ];

  return (
    <div className="recent-classes-container">
      <h3 className="section-title">Recent Classes</h3>
      <table className="classes-table">
        <thead>
          <tr>
            <th>Class Name</th>
            <th>Subject</th>
            <th>Students</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cls, idx) => (
            <tr key={idx}>
              <td className="font-semibold text-gray-800">{cls.name}</td>
              <td className="text-gray-500">{cls.subject}</td>
              <td className="text-gray-600">{cls.students}</td>
              <td>
                <span className={`status-badge ${cls.statusStyle}`}>
                  {cls.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentClasses;
