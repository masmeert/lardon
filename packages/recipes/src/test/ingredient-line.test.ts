import { describe, expect, it } from "vite-plus/test";

import { amountInput, ingredientFromParts, parseIngredientLine } from "../ingredient-line";

describe("parseIngredientLine", () => {
  it.each([
    ["200 g flour", { quantity: 200, unit: "g", name: "flour" }],
    ["200g butter", { quantity: 200, unit: "g", name: "butter" }],
    ["2 eggs", { quantity: 2, unit: null, name: "eggs" }],
    ["1 1/2 cups milk, warm", { quantity: 1.5, unit: "cup", name: "milk, warm" }],
    ["½ tsp salt", { quantity: 0.5, unit: "tsp", name: "salt" }],
    ["1,5 l water", { quantity: 1.5, unit: "l", name: "water" }],
    ["3 cloves garlic, crushed", { quantity: 3, unit: "clove", name: "garlic, crushed" }],
    ["2 Tablespoons  olive oil", { quantity: 2, unit: "tbsp", name: "olive oil" }],
    ["salt and pepper", { quantity: null, unit: null, name: "salt and pepper" }],
    ["2 g", { quantity: 2, unit: null, name: "g" }],
  ])("reads %s", (line, expected) => {
    expect(parseIngredientLine(line)).toEqual(expected);
  });

  it("skips blank lines", () => {
    expect(parseIngredientLine("   ")).toBeNull();
  });
});

describe("ingredientFromParts", () => {
  it.each([
    [
      { amount: "200", unit: "g", name: "flour, sifted" },
      { quantity: 200, unit: "g", name: "flour, sifted" },
    ],
    [
      { amount: "1,5", unit: "l", name: "water" },
      { quantity: 1.5, unit: "l", name: "water" },
    ],
    [
      { amount: "3", unit: null, name: "eggs" },
      { quantity: 3, unit: null, name: "eggs" },
    ],
    [
      { amount: "", unit: "pinch", name: "salt" },
      { quantity: null, unit: "pinch", name: "salt" },
    ],
    [
      { amount: "", unit: null, name: "2 cloves garlic" },
      { quantity: 2, unit: "clove", name: "garlic" },
    ],
  ] as const)("builds %o", (parts, expected) => {
    expect(ingredientFromParts(parts)).toEqual(expected);
  });

  it("skips an ingredient without a name", () => {
    expect(ingredientFromParts({ amount: "200", unit: "g", name: " " })).toBeNull();
  });
});

describe("amountInput", () => {
  it.each([
    ["0000", "0"],
    ["007", "7"],
    [",5", "0,5"],
    ["0,25", "0,25"],
    ["1,2,3", "1,2"],
    ["1.5", "1.5"],
    ["12a", "12"],
    ["200000", "2000"],
    ["", ""],
  ])("turns %j into %j", (typed, cleaned) => {
    expect(amountInput(typed)).toBe(cleaned);
  });
});
