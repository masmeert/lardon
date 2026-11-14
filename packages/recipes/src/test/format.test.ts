import { describe, expect, it } from "vite-plus/test";

import { formatDuration, formatQuantity } from "../format";

describe("formatQuantity", () => {
  it.each([
    [2, "2"],
    [0.5, "½"],
    [1.25, "1¼"],
    [1 / 3, "⅓"],
    [2.999, "3"],
    [1.43, "1.43"],
  ])("writes %s as %s", (quantity, expected) => {
    expect(formatQuantity(quantity)).toBe(expected);
  });
});

describe("formatDuration", () => {
  it.each([
    [45, "45 min"],
    [60, "1 h"],
    [95, "1 h 35 min"],
  ])("writes %s minutes as %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});
