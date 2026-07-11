/*import { statCardStyles as styles } from "./StatCard.styles";

function StatCard({
  title,
  value,
  change,
  icon: Icon,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <p className={styles.title}>{title}</p>

        <h2 className={styles.value}>{value}</h2>

        <p className={styles.change}>{change}</p>
      </div>

      <div className={styles.iconBox}>
        <Icon size={30} className={styles.icon} />
      </div>
    </div>
  );
}
  
export default StatCard;*/

import React from 'react';
import './StatCard.css';

const StatCard = ({ icon, label, value, colorClass }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;
