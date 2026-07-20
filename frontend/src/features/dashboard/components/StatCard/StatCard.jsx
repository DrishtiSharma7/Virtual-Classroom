import React from "react";
import "./StatCard.css";

const StatCard = ({ icon, label, value, colorClass }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${colorClass}`}>{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;
