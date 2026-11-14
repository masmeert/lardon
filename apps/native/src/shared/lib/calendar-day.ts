function dateOf(day: string) {
  const [year = 1970, month = 1, date = 1] = day.split("-").map(Number);

  return new Date(year, month - 1, date);
}

export function calendarDay(date: Date) {
  return [
    String(date.getFullYear()),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function addDays(day: string, days: number) {
  const date = dateOf(day);
  date.setDate(date.getDate() + days);

  return calendarDay(date);
}

export function weekdayName(day: string) {
  return dateOf(day).toLocaleDateString(undefined, { weekday: "long" });
}

export function shortDate(day: string) {
  return dateOf(day).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function relativeDayName(day: string, today: string) {
  if (day === today) return "Today";

  if (day === addDays(today, 1)) return "Tomorrow";

  if (day === addDays(today, -1)) return "Yesterday";

  return `${weekdayName(day)} ${shortDate(day)}`;
}

export function endOfWeek(day: string) {
  return addDays(day, (7 - dateOf(day).getDay()) % 7);
}
