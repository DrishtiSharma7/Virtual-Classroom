export const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "last7", label: "Last 7 Days" },
  { key: "last30", label: "Last 30 Days" },
  { key: "last3months", label: "Last 3 Months" },
  { key: "thisyear", label: "This Year" },
  { key: "custom", label: "Custom Range" },
];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Resolves a preset key (or explicit custom from/to) into ISO from/to bounds
// sent straight to the backend query params.
export function resolveDateRange(presetKey, customFrom, customTo) {
  const now = new Date();

  switch (presetKey) {
    case "today":
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
    case "last7": {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 6);
      return { from: from.toISOString(), to: endOfDay(now).toISOString() };
    }
    case "last3months": {
      const from = startOfDay(now);
      from.setMonth(from.getMonth() - 3);
      return { from: from.toISOString(), to: endOfDay(now).toISOString() };
    }
    case "thisyear": {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from: from.toISOString(), to: endOfDay(now).toISOString() };
    }
    case "custom":
      if (customFrom && customTo) {
        return {
          from: startOfDay(customFrom).toISOString(),
          to: endOfDay(customTo).toISOString(),
        };
      }
      return resolveDateRange("last30");
    case "last30":
    default: {
      const from = startOfDay(now);
      from.setDate(from.getDate() - 29);
      return { from: from.toISOString(), to: endOfDay(now).toISOString() };
    }
  }
}

export function formatDateLabel(isoDate) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
