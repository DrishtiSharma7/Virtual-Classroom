import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const STATUS_MAP = {
  Excellent: { className: "analytics-status-good", Icon: CheckCircle2 },
  Good: { className: "analytics-status-good", Icon: CheckCircle2 },
  Easy: { className: "analytics-status-good", Icon: CheckCircle2 },
  "Needs Attention": { className: "analytics-status-warning", Icon: AlertTriangle },
  Medium: { className: "analytics-status-warning", Icon: AlertTriangle },
  Critical: { className: "analytics-status-critical", Icon: XCircle },
  Hard: { className: "analytics-status-critical", Icon: XCircle },
};

// Status is always shown as an icon + label together, never color alone.
const StatusBadge = ({ status }) => {
  const entry = STATUS_MAP[status] || {
    className: "analytics-status-warning",
    Icon: AlertTriangle,
  };
  const { className, Icon } = entry;
  return (
    <span className={`analytics-status-badge ${className}`}>
      <Icon size={12} aria-hidden="true" />
      {status}
    </span>
  );
};

export default StatusBadge;
