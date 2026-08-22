// Chart color roles for the Analytics dashboard (light mode only — the rest
// of the app has no dark mode, so charts intentionally match that rather
// than introducing an orphaned dark theme).
//
// - `primary` is used for every single-series trend chart (nothing to
//   distinguish from an adjacent series, so brand indigo is fine).
// - `categorical` is used only when 2-3 genuinely different series share one
//   chart (e.g. attendance% / participation% / engagement all on a 0-100
//   scale). Always assigned in this fixed order, never cycled.
// - `status` is reserved for present/absent/low-attendance, easy/medium/hard,
//   and attendance-status badges — always paired with an icon/label, never
//   color alone.
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
