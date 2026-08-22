import { TrendingUp, AlertTriangle, Info } from "lucide-react";
import "./InsightsPanel.css";

const ICONS = {
  positive: TrendingUp,
  warning: AlertTriangle,
  info: Info,
};

const InsightsPanel = ({ insights = [], loading }) => {
  if (loading) {
    return (
      <div className="insights-panel">
        <h3 className="insights-title">Insights &amp; Alerts</h3>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="insights-panel">
      <h3 className="insights-title">Insights &amp; Alerts</h3>
      {insights.length === 0 ? (
        <p className="insights-empty">
          Not enough data yet to generate insights for this range.
        </p>
      ) : (
        <ul className="insights-list">
          {insights.map((insight, index) => {
            const Icon = ICONS[insight.type] || Info;
            return (
              <li key={index} className={`insight-item insight-${insight.type}`}>
                <Icon size={16} aria-hidden="true" />
                <span>{insight.message}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default InsightsPanel;
