export const CHART_COLORS = {
  primary: "#5b5fef",
  primarySoft: "#eef0fd",
  categorical: ["#2a78d6", "#eb6834", "#1baf7a"],
  status: {
    good: "#0ca30c",
    warning: "#fab219",
    critical: "#d03b3b",
  },
  chrome: {
    surface: "#ffffff",
    grid: "#e5e7eb",
    axis: "#9ca3af",
    mutedText: "#6b7280",
    primaryText: "#111827",
  },
};

export function statusColor(status) {
  if (status === "Excellent" || status === "Good" || status === "Easy") {
    return CHART_COLORS.status.good;
  }
  if (status === "Needs Attention" || status === "Medium") {
    return CHART_COLORS.status.warning;
  }
  return CHART_COLORS.status.critical;
}
