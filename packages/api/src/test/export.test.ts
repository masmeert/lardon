import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vite-plus/test";

import { selectSections } from "../recipes/export";
import { formatDuration, formatQuantity } from "../recipes/export/format";
import { escapeMarkdown, recipeToMarkdown } from "../recipes/export/markdown";
import { recipeToPdf } from "../recipes/export/pdf";
import { recipeToText } from "../recipes/export/text";
import type { Recipe } from "../recipes/service";
import { TINY_PNG, createTestEnvironment } from "./environment";

const cremeBrulee: Recipe = {
  id: "recipe",
  userId: "user",
  familyId: null,
  createdById: "user",
  title: "Crème brûlée",
  servings: 6,
  servingsUnit: null,
  prepTimeMinutes: 20,
  cookTimeMinutes: 45,
  ingredients: [
    {
      title: null,
      ingredients: [
        { quantity: 0.5, unit: "l", name: "cream", note: null },
        { quantity: 1 / 3, unit: "cup", name: "sugar", note: "plus extra for the top" },
        { quantity: null, unit: null, name: "vanilla pod", note: null },
      ],
    },
  ],
  steps: [
    {
      title: "Custard",
      steps: [{ text: "Heat the cream.\nDon't let it boil." }, { text: "Whisk in the yolks." }],
    },
    { title: "Finish", steps: [{ text: "Torch the sugar 🔥." }] },
  ],
  nutrition: {
    calories: 410,
    protein: 5.25,
    carbohydrates: null,
    sugar: null,
    fat: 33,
    saturatedFat: null,
    fiber: null,
    sodium: null,
  },
  tags: ["dessert", "french"],
  notes: "Best made a day ahead.\n\n# Not a heading",
  sourceUrl: "https://example.com/creme-brulee",
  imageKey: null,
  createdAt: 0,
  updatedAt: 0,
};

describe("formatting", () => {
  it("formats quantities and durations", () => {
    expect([0.5, 1.5, 1 / 3, 2.25, 0.1, 3, 2.999].map(formatQuantity)).toEqual([
      "½",
      "1½",
      "⅓",
      "2¼",
      "0.1",
      "3",
      "3",
    ]);
    expect([5, 60, 95].map(formatDuration)).toEqual(["5 min", "1 h", "1 h 35 min"]);
  });

  it("escapes markdown", () => {
    expect(escapeMarkdown("# hi *there* [x]")).toBe("\\# hi \\*there\\* \\[x\\]");
    expect(escapeMarkdown("1. one")).toBe("1\\. one");
  });
});

describe("export", () => {
  it("renders plain text", () => {
    expect(recipeToText(cremeBrulee)).toBe(`CRÈME BRÛLÉE
Serves 6 · Prep 20 min · Cook 45 min · Total 1 h 5 min
Tags: dessert, french

INGREDIENTS
• ½ l cream
• ⅓ cup sugar, plus extra for the top
• vanilla pod

STEPS

Custard
1. Heat the cream.
   Don't let it boil.
2. Whisk in the yolks.

Finish
1. Torch the sugar 🔥.

NUTRITION (per serving)
Calories: 410 kcal
Protein: 5.3 g
Fat: 33 g

NOTES
Best made a day ahead.

# Not a heading

Source: https://example.com/creme-brulee
`);
  });

  it("renders markdown", () => {
    expect(recipeToMarkdown(cremeBrulee)).toBe(`# Crème brûlée

*Serves 6 · Prep 20 min · Cook 45 min · Total 1 h 5 min*

**Tags:** dessert, french

## Ingredients

- ½ l cream
- ⅓ cup sugar, plus extra for the top
- vanilla pod

## Steps

### Custard

1. Heat the cream.
   Don't let it boil.
2. Whisk in the yolks.

### Finish

1. Torch the sugar 🔥.

## Nutrition (per serving)

| Nutrient | Amount |
| --- | ---: |
| Calories | 410 kcal |
| Protein | 5.3 g |
| Fat | 33 g |

## Notes

Best made a day ahead.

\\# Not a heading

Source: <https://example.com/creme-brulee>
`);
  });

  it("exports only the selected sections", () => {
    const partial = selectSections(cremeBrulee, ["ingredients", "notes"]);
    expect(recipeToMarkdown(partial)).toBe(`# Crème brûlée

## Ingredients

- ½ l cream
- ⅓ cup sugar, plus extra for the top
- vanilla pod

## Notes

Best made a day ahead.

\\# Not a heading
`);
    expect(recipeToText(selectSections(cremeBrulee, ["details", "source"]))).toBe(`CRÈME BRÛLÉE
Serves 6 · Prep 20 min · Cook 45 min · Total 1 h 5 min

Source: https://example.com/creme-brulee
`);
  });

  it("renders a multi-page PDF, including characters the standard fonts lack", async () => {
    const longRecipe = {
      ...cremeBrulee,
      title: "Борщ ⅔ — a very long recipe 🍲",
      steps: [
        {
          title: null,
          steps: Array.from({ length: 60 }, (_, index) => ({
            text: `Step ${index + 1}: ${"stir gently and keep tasting ".repeat(8)}`,
          })),
        },
      ],
    };
    const pdf = await recipeToPdf(longRecipe, { bytes: TINY_PNG, contentType: "image/png" });
    const parsed = await PDFDocument.load(pdf);
    expect(parsed.getPageCount()).toBeGreaterThan(1);
    expect(parsed.getTitle()).toBe(longRecipe.title);
  });

  it("exports through the API with access checks", async () => {
    const { createUser } = await createTestEnvironment();
    const alice = await createUser("Alice");
    const bob = await createUser("Bob");
    const created = await alice.api.recipes.create({ title: "Crème Toast", tags: ["quick"] });

    expect(await alice.api.recipes.export({ id: created.id, format: "markdown" })).toEqual({
      filename: "creme-toast.md",
      content: "# Crème Toast\n\n**Tags:** quick\n",
    });
    expect(
      await alice.api.recipes.export({ id: created.id, format: "markdown", include: ["steps"] }),
    ).toMatchObject({ content: "# Crème Toast\n" });
    await expect(
      alice.api.recipes.export({
        id: created.id,
        format: "text",
        include: ["comments" as "notes"],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(bob.api.recipes.export({ id: created.id, format: "text" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
