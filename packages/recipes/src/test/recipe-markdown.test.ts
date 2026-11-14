import { describe, expect, it } from "vite-plus/test";

import { recipeMarkdown } from "../recipe-markdown";

describe("recipeMarkdown", () => {
  const recipe = {
    title: "Pancakes",
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 15,
    notes: "Rest the batter.",
    ingredients: [
      { quantity: 250, unit: "g" as const, name: "flour" },
      { quantity: 3, name: "eggs" },
      { name: "a pinch of salt" },
    ],
    steps: ["Mix everything.", "Cook for 2 min."],
  };

  it("writes the recipe as it is", () => {
    expect(recipeMarkdown(recipe)).toBe(
      [
        "# Pancakes",
        "25 min, 4 servings",
        "## Ingredients",
        "- 250 g flour\n- 3 eggs\n- a pinch of salt",
        "## Steps",
        "1. Mix everything.\n2. Cook for 2 min.",
        "## Notes",
        "Rest the batter.\n",
      ].join("\n\n"),
    );
  });

  it("scales the amounts and servings", () => {
    const markdown = recipeMarkdown(recipe, 2.5, "metric");

    expect(markdown).toContain("25 min, 10 servings");
    expect(markdown).toContain("- 625 g flour\n- 7½ eggs\n- a pinch of salt");
  });
});
