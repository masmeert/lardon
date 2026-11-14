const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function count(amount: number, unit: string) {
  return `${amount} ${unit}${amount === 1 ? "" : "s"} ago`;
}

export function timeAgo(date: Date, nowMs: number) {
  const elapsedMs = nowMs - date.getTime();

  if (elapsedMs < MINUTE_MS) return "Just now";

  if (elapsedMs < HOUR_MS) return count(Math.floor(elapsedMs / MINUTE_MS), "minute");

  if (elapsedMs < DAY_MS) return count(Math.floor(elapsedMs / HOUR_MS), "hour");

  if (elapsedMs < 2 * DAY_MS) return "Yesterday";

  if (elapsedMs < 7 * DAY_MS) return count(Math.floor(elapsedMs / DAY_MS), "day");

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date(nowMs).getFullYear() ? undefined : "numeric",
  });
}
