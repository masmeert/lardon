import { describe, expect, it } from "vite-plus/test";

import { formatDuration, formatQuantity, recipeText } from "../format";
import type { RecipeDetail } from "../queries";

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

describe("recipeText", () => {
  const recipe: RecipeDetail = {
    id: "pancakes",
    title: "Pancakes",
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 15,
    notes: "Rest the batter.",
    visibility: "private",
    createdById: "user",
    createdAt: 0,
    updatedAt: 0,
    ingredients: [
      {
        id: "flour",
        recipeId: "pancakes",
        position: "a0",
        quantity: 250,
        unit: "g",
        name: "flour",
      },
      { id: "eggs", recipeId: "pancakes", position: "a1", quantity: 2, name: "eggs" },
      { id: "salt", recipeId: "pancakes", position: "a2", name: "salt" },
    ],
    steps: [
      { id: "mix", recipeId: "pancakes", position: "a0", text: "Mix everything." },
      { id: "cook", recipeId: "pancakes", position: "a1", text: "Cook for 2 min." },
    ],
    tags: [],
    folders: [],
  };

  it("lays out a recipe as plain text", () => {
    expect(recipeText(recipe)).toBe(
      [
        "Pancakes\nServes 4, 25 min",
        "Ingredients\n• 250 g flour\n• 2 eggs\n• salt",
        "Steps\n1. Mix everything.\n2. Cook for 2 min.",
        "Notes\nRest the batter.",
      ].join("\n\n"),
    );
  });
});
