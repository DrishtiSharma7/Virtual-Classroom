import React from "react";
import "./RecentClasses.css";

const RecentClasses = ({ classes = [] }) => {
  return (
    <div className="recent-classes-container">
      <h3 className="section-title">Recent Classes</h3>
      {classes.length === 0 ? (
        <p className="text-sm text-gray-500">No classes yet.</p>
      ) : (
        <table className="classes-table">
          <thead>
            <tr>
              <th scope="col">Class Name</th>
              <th scope="col">Subject</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr key={cls._id}>
                <td className="font-semibold text-gray-800">{cls.name}</td>
                <td className="text-gray-500">{cls.subject}</td>
                <td className="text-gray-600">
                  {cls.createdAt
                    ? new Date(cls.createdAt).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecentClasses;
