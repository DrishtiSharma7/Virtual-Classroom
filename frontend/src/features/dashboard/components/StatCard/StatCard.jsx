import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import "./StatCard.css";

const TREND_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const StatCard = ({
  icon,
  label,
  value,
  colorClass,
  description,
  trend,
  trendDirection,
  tooltip,
}) => {
  const TrendIcon = trendDirection ? TREND_ICON[trendDirection] : null;
  const trendClass =
    trendDirection === "up"
      ? "stat-trend-up"
      : trendDirection === "down"
        ? "stat-trend-down"
        : "stat-trend-flat";

  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${colorClass}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="stat-label">{label}</p>
          {tooltip && (
            <span className="stat-tooltip-wrapper" tabIndex={0} aria-label={tooltip}>
              <Info size={12} aria-hidden="true" />
              <span className="stat-tooltip-bubble" role="tooltip">
                {tooltip}
              </span>
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="stat-value">{value}</h3>
          {trend !== undefined && trend !== null && TrendIcon && (
            <span className={`stat-trend ${trendClass}`}>
              <TrendIcon size={13} aria-hidden="true" />
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {description && <p className="stat-description">{description}</p>}
      </div>
    </div>
  );
};

export default StatCard;
