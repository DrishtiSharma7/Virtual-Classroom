import React from "react";
import "./RecentActivity.css";

function RecentActivity({ activities }) {
  return (
    <div className="recent-activity">
      <h3 className="recent-activity-title">Recent Activity</h3>

      <ul className="recent-activity-list">
        {activities.length === 0 ? (
          <li className="recent-activity-empty">No recent activity.</li>
        ) : (
          activities.map((activity, i) => (
            <li key={i} className="recent-activity-item">
              <span className="recent-activity-dot"></span>
              <span>{activity.text}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default RecentActivity;
