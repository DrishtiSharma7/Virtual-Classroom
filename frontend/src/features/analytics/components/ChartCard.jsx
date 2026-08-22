import { Info, Loader2 } from "lucide-react";
import "./ChartCard.css";

const ChartCard = ({
  title,
  tooltip,
  actions,
  loading,
  isEmpty,
  emptyMessage = "No data available yet.",
  height = 300,
  children,
}) => {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="flex items-center gap-1.5">
          <h3 className="chart-card-title">{title}</h3>
          {tooltip && (
            <span className="chart-card-tooltip-wrapper" tabIndex={0} aria-label={tooltip}>
              <Info size={13} aria-hidden="true" />
              <span className="chart-card-tooltip-bubble" role="tooltip">
                {tooltip}
              </span>
            </span>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div style={{ minHeight: height }} className="relative">
        {loading ? (
          <div
            className="chart-card-skeleton"
            style={{ height }}
            role="status"
            aria-label={`Loading ${title}`}
          >
            <Loader2 className="animate-spin text-gray-300" size={24} />
          </div>
        ) : isEmpty ? (
          <div className="chart-card-empty" style={{ height }} role="status">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;
