import { describe, expect, it } from "vite-plus/test";

import { convertAmount, unitCode } from "../units";

describe("convertAmount", () => {
  it("leaves amounts alone in the original units", () => {
    expect(convertAmount(2, "cup", "original")).toEqual({ quantity: 2, unit: "cup" });
  });

  it("converts imperial to metric, rounding to kitchen precision", () => {
    expect(convertAmount(8, "oz", "metric")).toEqual({ quantity: 225, unit: "g" });
    expect(convertAmount(1, "cup", "metric")).toEqual({ quantity: 235, unit: "ml" });
    expect(convertAmount(3, "lb", "metric")).toEqual({ quantity: 1.36, unit: "kg" });
  });

  it("converts metric to imperial in friendly fractions", () => {
    expect(convertAmount(200, "g", "imperial")).toEqual({ quantity: 7, unit: "oz" });
    expect(convertAmount(200, "ml", "imperial")).toEqual({ quantity: 0.875, unit: "cup" });
    expect(convertAmount(1, "kg", "imperial")).toEqual({ quantity: 2.25, unit: "lb" });
    expect(convertAmount(30, "ml", "imperial")).toEqual({ quantity: 2, unit: "tbsp" });
    expect(convertAmount(700, "ml", "imperial")).toEqual({ quantity: 3, unit: "cup" });
  });

  it("keeps spoons, count units and amounts already in the system", () => {
    expect(convertAmount(2, "tbsp", "metric")).toEqual({ quantity: 2, unit: "tbsp" });
    expect(convertAmount(3, "clove", "metric")).toEqual({ quantity: 3, unit: "clove" });
    expect(convertAmount(250, "g", "metric")).toEqual({ quantity: 250, unit: "g" });
    expect(convertAmount(2, null, "imperial")).toEqual({ quantity: 2, unit: null });
  });
});

describe("unitCode", () => {
  it.each([
    ["Tbsp", "tbsp"],
    ["teaspoons", "tsp"],
    ["cups", "cup"],
    ["lbs", "lb"],
    ["g.", "g"],
    ["Cloves", "clove"],
    ["pinches", "pinch"],
    ["handful", "handful"],
    ["onions", null],
  ])("reads %j as %j", (text, code) => {
    expect(unitCode(text)).toBe(code);
  });
});
