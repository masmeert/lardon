import { describe, expect, it } from "vite-plus/test";

import {
  addIngredient,
  addRecipeSection,
  addRecipeTag,
  addStep,
  copyRecipe,
  createRecipe,
  deleteRecipe,
  editStep,
  moveIngredient,
  moveRecipe,
  moveRecipeSection,
  moveStep,
  removeIngredient,
  removeRecipeSection,
  removeRecipeTag,
  renameRecipeSection,
  restoreRecipe,
  setRecipeImage,
  setRecipeNutrition,
  updateIngredient,
  updateRecipeDetails,
} from "../commands";
import { recipeEvents } from "../events";
import {
  deletedRecipes$,
  readRecipeDocument,
  recipe$,
  recipeSections$,
  recipes$,
} from "../queries";
import { createTestStore } from "./store";

function sectionIds(store: Awaited<ReturnType<typeof createTestStore>>, recipeId: string) {
  const sections = store.query(recipeSections$(recipeId));

  return {
    ingredients: sections
      .filter((section) => section.kind === "ingredients")
      .map((section) => section.id),
    steps: sections.filter((section) => section.kind === "steps").map((section) => section.id),
  };
}

describe("recipe commands", () => {
  it("creates a recipe with an empty ingredient and step section", async () => {
    const store = await createTestStore();
    const recipeId = createRecipe(store, { title: "  Pancakes ", createdById: "alice" });

    expect(store.query(recipe$(recipeId))).toMatchObject({
      title: "Pancakes",
      createdById: "alice",
      tags: [],
      deletedAt: null,
    });
    expect(readRecipeDocument(store, recipeId)).toEqual({
      title: "Pancakes",
      servings: null,
      servingsUnit: null,
      prepTimeMinutes: null,
      cookTimeMinutes: null,
      ingredients: [{ title: null, ingredients: [] }],
      steps: [{ title: null, steps: [] }],
      nutrition: null,
      tags: [],
      notes: null,
      sourceUrl: null,
      imageKey: null,
    });
  });

  it("creates a recipe from a full document and keeps its order", async () => {
    const store = await createTestStore();

    const recipeId = createRecipe(store, {
      title: "Lasagne",
      createdById: "alice",
      servings: 4,
      tags: ["Italian", "italian", " pasta "],
      ingredients: [
        {
          title: "Sauce",
          ingredients: [
            { quantity: 500, unit: "g", name: "tomatoes", note: null },
            { quantity: null, unit: null, name: "basil", note: "fresh" },
          ],
        },
        { title: "Pasta", ingredients: [{ quantity: 12, unit: null, name: "sheets", note: null }] },
      ],
      steps: [{ title: null, steps: [{ text: "Make the sauce." }, { text: "Layer and bake." }] }],
    });

    const document = readRecipeDocument(store, recipeId);
    expect(document?.tags).toEqual(["Italian", "pasta"]);
    expect(document?.ingredients.map((section) => section.title)).toEqual(["Sauce", "Pasta"]);
    expect(document?.ingredients[0]?.ingredients.map((ingredient) => ingredient.name)).toEqual([
      "tomatoes",
      "basil",
    ]);
    expect(document?.steps[0]?.steps.map((step) => step.text)).toEqual([
      "Make the sauce.",
      "Layer and bake.",
    ]);
  });

  it("updates only the given details and never moves updatedAt backwards", async () => {
    const store = await createTestStore();

    const recipeId = createRecipe(store, {
      title: "Soup",
      createdById: "alice",
      servings: 2,
      notes: "Old",
    });

    const createdAt = store.query(recipe$(recipeId))!.updatedAt;

    updateRecipeDetails(store, recipeId, { title: "Leek soup", notes: "   " });
    expect(store.query(recipe$(recipeId))).toMatchObject({
      title: "Leek soup",
      servings: 2,
      notes: null,
    });

    store.commit(
      recipeEvents.recipeDetailsUpdated({
        recipeId,
        updatedAt: new Date(createdAt.getTime() - 60_000),
        servings: 6,
      }),
    );
    const updated = store.query(recipe$(recipeId))!;
    expect(updated.servings).toBe(6);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
  });

  it("manages tags, nutrition and the picture", async () => {
    const store = await createTestStore();
    const recipeId = createRecipe(store, { title: "Toast", createdById: "alice" });

    addRecipeTag(store, recipeId, "Quick");
    addRecipeTag(store, recipeId, "quick");
    addRecipeTag(store, recipeId, "  ");
    addRecipeTag(store, recipeId, "Breakfast");
    removeRecipeTag(store, recipeId, "QUICK");
    setRecipeImage(store, recipeId, "recipes/picture.jpg");
    setRecipeNutrition(store, recipeId, {
      calories: 120,
      protein: 4,
      carbohydrates: null,
      sugar: null,
      fat: null,
      saturatedFat: null,
      fiber: null,
      sodium: null,
    });

    expect(store.query(recipe$(recipeId))).toMatchObject({
      tags: ["Breakfast"],
      imageKey: "recipes/picture.jpg",
      nutrition: { calories: 120, protein: 4 },
    });
  });

  it("adds, edits, reorders and removes ingredients across sections", async () => {
    const store = await createTestStore();
    const recipeId = createRecipe(store, { title: "Curry", createdById: "alice" });
    const [main] = sectionIds(store, recipeId).ingredients;
    const spices = addRecipeSection(store, recipeId, "ingredients", " Spices ");

    const onion = addIngredient(store, recipeId, main!, { name: "onion", quantity: 1 });

    const garlic = addIngredient(store, recipeId, main!, {
      name: "garlic",
      unit: " cloves ",
      quantity: 2,
    });

    const rice = addIngredient(store, recipeId, main!, { name: "rice" });
    addIngredient(store, recipeId, spices, { name: "cumin" });

    updateIngredient(store, recipeId, onion, { note: "diced" });
    moveIngredient(store, recipeId, rice, main!, 0);
    moveIngredient(store, recipeId, garlic, spices, 0);
    removeIngredient(store, recipeId, onion);

    expect(readRecipeDocument(store, recipeId)?.ingredients).toEqual([
      { title: null, ingredients: [{ quantity: null, unit: null, name: "rice", note: null }] },
      {
        title: "Spices",
        ingredients: [
          { quantity: 2, unit: "cloves", name: "garlic", note: null },
          { quantity: null, unit: null, name: "cumin", note: null },
        ],
      },
    ]);
  });

  it("manages step sections", async () => {
    const store = await createTestStore();
    const recipeId = createRecipe(store, { title: "Bread", createdById: "alice" });
    const [dough] = sectionIds(store, recipeId).steps;
    const baking = addRecipeSection(store, recipeId, "steps", "Baking");
    const shaping = addRecipeSection(store, recipeId, "steps", "Shaping");

    renameRecipeSection(store, recipeId, dough!, "Dough");
    moveRecipeSection(store, recipeId, shaping, 1);
    const knead = addStep(store, recipeId, dough!, "Knead.");
    addStep(store, recipeId, dough!, "Mix.");
    addStep(store, recipeId, baking, "Bake.");
    moveStep(store, recipeId, knead, dough!, 1);
    editStep(store, recipeId, knead, " Knead for 10 minutes. ");

    const throwaway = addRecipeSection(store, recipeId, "steps", "Unused");
    addStep(store, recipeId, throwaway, "Never shown.");
    removeRecipeSection(store, recipeId, throwaway);

    expect(readRecipeDocument(store, recipeId)?.steps).toEqual([
      { title: "Dough", steps: [{ text: "Mix." }, { text: "Knead for 10 minutes." }] },
      { title: "Shaping", steps: [] },
      { title: "Baking", steps: [{ text: "Bake." }] },
    ]);
  });

  it("soft-deletes and restores recipes", async () => {
    const store = await createTestStore();
    const recipeId = createRecipe(store, { title: "Pie", createdById: "alice" });

    deleteRecipe(store, recipeId);
    expect(store.query(recipes$)).toEqual([]);
    expect(store.query(deletedRecipes$).map((recipe) => recipe.id)).toEqual([recipeId]);
    expect(readRecipeDocument(store, recipeId)).toBeNull();

    restoreRecipe(store, recipeId);
    expect(store.query(recipes$).map((recipe) => recipe.id)).toEqual([recipeId]);
  });

  it("copies and moves recipes between stores", async () => {
    const personal = await createTestStore();
    const family = await createTestStore();

    const recipeId = createRecipe(personal, {
      title: "Stew",
      createdById: "alice",
      ingredients: [
        { title: null, ingredients: [{ quantity: 1, unit: "kg", name: "beef", note: null }] },
      ],
    });

    const copyId = copyRecipe(personal, personal, recipeId, "alice");
    expect(personal.query(recipe$(copyId!))?.title).toBe("Stew (copy)");

    const movedId = moveRecipe(personal, family, recipeId, "bob");
    expect(personal.query(recipe$(recipeId))?.deletedAt).not.toBeNull();
    expect(family.query(recipe$(movedId!))).toMatchObject({ title: "Stew", createdById: "bob" });
    expect(readRecipeDocument(family, movedId!)?.ingredients).toEqual(
      readRecipeDocument(personal, copyId!)?.ingredients,
    );
  });

  it("rejects invalid input before it reaches the event log", async () => {
    const store = await createTestStore();
    expect(() => createRecipe(store, { title: "   ", createdById: "alice" })).toThrow();
    const recipeId = createRecipe(store, { title: "Toast", createdById: "alice" });
    expect(() =>
      updateRecipeDetails(store, recipeId, { sourceUrl: "javascript:alert(1)" }),
    ).toThrow();
    expect(() => updateRecipeDetails(store, recipeId, { prepTimeMinutes: -5 })).toThrow();
    expect(store.query(recipe$(recipeId))?.sourceUrl).toBeNull();
  });
});
