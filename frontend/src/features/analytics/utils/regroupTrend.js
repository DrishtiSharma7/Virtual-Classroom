// Re-buckets an already-fetched daily {date, value} series into weekly/monthly
// points on the client, so switching the granularity in the UI needs no new
// network request. Percentage-style metrics are averaged per bucket; raw
// counts (sessionActivity) are summed.
function bucketKey(dateStr, granularity) {
  const d = new Date(dateStr);
  if (granularity === "month") return dateStr.slice(0, 7);
  if (granularity === "week") {
    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
    return monday.toISOString().slice(0, 10);
  }
  return dateStr;
}

export function regroupTrend(series, granularity, { sum = false } = {}) {
  if (granularity === "day" || !series?.length) return series || [];

  const buckets = new Map();
  series.forEach((point) => {
    const key = bucketKey(point.date, granularity);
    if (!buckets.has(key)) buckets.set(key, []);
    if (point.value !== null && point.value !== undefined) {
      buckets.get(key).push(point.value);
    }
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, values]) => ({
      date,
      value: values.length
        ? sum
          ? values.reduce((a, b) => a + b, 0)
          : Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : null,
    }));
}
