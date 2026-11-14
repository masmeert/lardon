import { describe, expect, it } from "vite-plus/test";

import { addDays, calendarDay, endOfWeek, relativeDayName } from "../calendar-day";

describe("calendar days", () => {
  it("formats a local date", () => {
    expect(calendarDay(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("adds days across months, years and leap days", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("ends a week on Sunday", () => {
    expect(endOfWeek("2026-11-14")).toBe("2026-11-15");
    expect(endOfWeek("2026-11-15")).toBe("2026-11-15");
    expect(endOfWeek("2026-11-16")).toBe("2026-11-22");
    expect(endOfWeek("2026-12-28")).toBe("2027-01-03");
  });

  it("names days relative to today", () => {
    expect(relativeDayName("2026-11-14", "2026-11-14")).toBe("Today");
    expect(relativeDayName("2026-11-15", "2026-11-14")).toBe("Tomorrow");
    expect(relativeDayName("2026-11-13", "2026-11-14")).toBe("Yesterday");
  });
});
