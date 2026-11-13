import { createMergeableStore } from "tinybase";
import { describe, expect, it } from "vite-plus/test";

import {
  type RecipeDraft,
  addToCollection,
  cleanUp,
  clearMeal,
  copyRecipe,
  createCollection,
  createRecipe,
  deleteCollection,
  deleteRecipes,
  emptyDraft,
  moveRecipe,
  planMeal,
  recipeDraft,
  saveRecipe,
  setVisibility,
} from "../commands";
import { collectionList, everyRecipe, mealPlan, recipeDetail, recipeList } from "../queries";
import { createRecipeStore, isValidCell, isValidRowId, readRows } from "../tables";

function draft(changes: Partial<RecipeDraft> = {}): RecipeDraft {
  return {
    ...emptyDraft(),
    title: "Tomato soup",
    servings: 4,
    ingredients: [
      { id: "tomatoes", quantity: 800, unit: "g", name: "tomatoes" },
      { id: "onion", quantity: 1, unit: null, name: "onion" },
      { id: "salt", quantity: null, unit: "pinch", name: "salt" },
    ],
    steps: [
      { id: "chop", text: "Chop the onion." },
      { id: "simmer", text: "Simmer for 20 minutes." },
    ],
    ...changes,
  };
}

function names(store: ReturnType<typeof createRecipeStore>, recipeId: string) {
  return recipeDetail(store.getTables(), recipeId)?.ingredients.map(
    (ingredient) => ingredient.name,
  );
}

describe("tables", () => {
  it("rejects bad local writes and drops bad cells arriving from other devices", () => {
    const store = createRecipeStore();
    store.setRow("recipes", "local", { title: "Soup", servings: "lots" });
    expect(store.hasRow("recipes", "local")).toBe(false);

    const unchecked = createMergeableStore();
    unchecked.setRow("recipes", "soup", {
      title: "Soup",
      servings: "lots",
      visibility: "public",
      createdById: "alice",
      createdAt: 1,
      updatedAt: 1,
    });
    unchecked.setRow("ingredients", "pail", {
      recipeId: "soup",
      position: "a0",
      unit: "bucket",
      name: "water",
    });
    store.merge(unchecked);

    expect(store.getRow("recipes", "soup")).toEqual({
      title: "Soup",
      createdById: "alice",
      createdAt: 1,
      updatedAt: 1,
    });
    expect(store.getRow("ingredients", "pail")).toEqual({
      recipeId: "soup",
      position: "a0",
      name: "water",
    });
  });

  it("checks cells and row ids the way the server will", () => {
    expect(isValidCell("recipes", "soup", "title", "Soup")).toBe(true);
    expect(isValidCell("recipes", "soup", "title", "  ")).toBe(false);
    expect(isValidCell("recipes", "soup", "servings", 0)).toBe(false);
    expect(isValidCell("recipes", "soup", "visibility", "public")).toBe(false);
    expect(isValidCell("recipes", "soup", "title", undefined)).toBe(true);
    expect(isValidCell("recipes", "soup", "colour", "red")).toBe(false);
    expect(isValidCell("ingredients", "salt", "unit", "pinch")).toBe(true);
    expect(isValidCell("ingredients", "salt", "unit", "bucket")).toBe(false);
    expect(isValidCell("recipeTags", "tag:soup", "recipeId", "soup")).toBe(true);
    expect(isValidCell("recipeTags", "tag:soup", "recipeId", "stew")).toBe(false);
    expect(isValidCell("meals", "2026-11-13", "recipeId", "soup")).toBe(true);
    expect(isValidRowId("meals", "2026-02-30")).toBe(false);
    expect(isValidRowId("meals", "tomorrow")).toBe(false);
    expect(isValidRowId("recipes", "a:b")).toBe(false);
    expect(isValidRowId("users", "alice")).toBe(false);
  });

  it("hides rows until their required cells have arrived", () => {
    const store = createRecipeStore();
    store.setRow("recipes", "soup", { servings: 2 });
    expect(readRows(store.getTables(), "recipes")).toEqual([]);

    store.setPartialRow("recipes", "soup", {
      title: "Soup",
      visibility: "private",
      createdById: "alice",
      createdAt: 1,
      updatedAt: 1,
    });
    expect(readRows(store.getTables(), "recipes").map((recipe) => recipe.id)).toEqual(["soup"]);
  });
});

describe("recipes", () => {
  it("creates a private recipe with ordered, cleaned lines", () => {
    const store = createRecipeStore();

    const recipeId = createRecipe(
      store,
      draft({
        title: "  Tomato soup ",
        notes: "   ",
        steps: [
          { id: "chop", text: " Chop the onion. " },
          { id: "blank", text: " " },
        ],
      }),
      "alice",
    );

    const recipe = recipeDetail(store.getTables(), recipeId);
    expect(recipe).toMatchObject({
      title: "Tomato soup",
      servings: 4,
      visibility: "private",
      createdById: "alice",
    });
    expect(recipe?.notes).toBeUndefined();
    expect(names(store, recipeId)).toEqual(["tomatoes", "onion", "salt"]);
    expect(recipe?.steps.map((step) => step.text)).toEqual(["Chop the onion."]);

    setVisibility(store, recipeId, "followers");
    expect(recipeDetail(store.getTables(), recipeId)?.visibility).toBe("followers");
  });

  it("saves only what the edit changed, keeping edits made meanwhile on another device", () => {
    const phone = createRecipeStore();
    const recipeId = createRecipe(phone, draft(), "alice");
    const tablet = createRecipeStore();
    tablet.merge(phone);

    const base = recipeDraft(phone, recipeId)!;
    saveRecipe(tablet, recipeId, recipeDraft(tablet, recipeId)!, {
      ...base,
      servings: 6,
      notes: "Serve hot.",
    });
    phone.merge(tablet);

    const before = phone.getRow("ingredients", "onion");
    saveRecipe(phone, recipeId, base, {
      ...base,
      title: "Roasted tomato soup",
      ingredients: [
        base.ingredients[1]!,
        base.ingredients[0]!,
        { id: "garlic", quantity: 2, unit: "clove", name: "garlic" },
      ],
    });

    const recipe = recipeDetail(phone.getTables(), recipeId)!;
    expect(recipe).toMatchObject({
      title: "Roasted tomato soup",
      servings: 6,
      notes: "Serve hot.",
    });
    expect(names(phone, recipeId)).toEqual(["onion", "tomatoes", "garlic"]);
    expect(phone.getRow("ingredients", "onion")).toEqual(before);
    expect(phone.hasRow("ingredients", "salt")).toBe(false);
  });

  it("doesn't bring back a line deleted elsewhere, nor overwrite a field it didn't change", () => {
    const phone = createRecipeStore();
    const recipeId = createRecipe(phone, draft(), "alice");
    const base = recipeDraft(phone, recipeId)!;
    const tablet = createRecipeStore();
    tablet.merge(phone);

    saveRecipe(tablet, recipeId, base, {
      ...base,
      title: "Tablet title",
      ingredients: base.ingredients.filter((ingredient) => ingredient.id !== "onion"),
    });
    phone.merge(tablet);

    saveRecipe(phone, recipeId, base, {
      ...base,
      ingredients: base.ingredients.map((ingredient) =>
        ingredient.id === "onion" ? { ...ingredient, quantity: 2 } : ingredient,
      ),
    });

    expect(recipeDetail(phone.getTables(), recipeId)?.title).toBe("Tablet title");
    expect(names(phone, recipeId)).toEqual(["tomatoes", "salt"]);
  });

  it("only touches updatedAt when something changed", () => {
    const store = createRecipeStore();
    const recipeId = createRecipe(store, draft(), "alice");
    store.setCell("recipes", recipeId, "updatedAt", 5);
    const base = recipeDraft(store, recipeId)!;

    saveRecipe(store, recipeId, base, base);
    expect(store.getCell("recipes", recipeId, "updatedAt")).toBe(5);

    saveRecipe(store, recipeId, base, { ...base, cookMinutes: 20 });
    expect(store.getCell("recipes", recipeId, "updatedAt")).toBeGreaterThan(5);
  });

  it("deletes a recipe with its lines, links and meals", () => {
    const store = createRecipeStore();
    const recipeId = createRecipe(store, draft(), "alice");
    const tagId = createCollection(store, "tags", "Soup");
    addToCollection(store, "tags", tagId, [recipeId]);
    planMeal(store, "2026-11-13", { recipeId, servings: null });

    deleteRecipes(store, [recipeId]);

    expect(store.getTables()).toEqual({ tags: { [tagId]: { name: "Soup" } } });
  });

  it("hides and cleans up lines left behind by a delete on another device", () => {
    const phone = createRecipeStore();
    const recipeId = createRecipe(phone, draft(), "alice");
    const tablet = createRecipeStore();
    tablet.merge(phone);

    deleteRecipes(phone, [recipeId]);
    const base = recipeDraft(tablet, recipeId)!;
    saveRecipe(tablet, recipeId, base, {
      ...base,
      ingredients: [...base.ingredients, { id: "cream", quantity: 100, unit: "ml", name: "cream" }],
    });
    phone.merge(tablet);

    expect(recipeList(phone.getTables(), everyRecipe)).toEqual([]);
    expect(readRows(phone.getTables(), "ingredients").map((ingredient) => ingredient.id)).toEqual([
      "cream",
    ]);
    expect(cleanUp(phone)).toBeGreaterThanOrEqual(1);
    expect(phone.getTables()).toEqual({});
  });

  it("cleans up rows that never became valid, with their lines", () => {
    const store = createRecipeStore();
    const recipeId = createRecipe(store, draft(), "alice");
    store.delCell("recipes", recipeId, "createdById");

    expect(cleanUp(store)).toBe(6);
    expect(store.getTables()).toEqual({});
  });

  it("moves a recipe to another family under the same id, without its links", () => {
    const personal = createRecipeStore();
    const family = createRecipeStore();
    const recipeId = createRecipe(personal, draft(), "alice");
    addToCollection(personal, "tags", createCollection(personal, "tags", "Soup"), [recipeId]);

    expect(moveRecipe(personal, family, recipeId, null)).toBe(true);

    expect(recipeList(personal.getTables(), everyRecipe)).toEqual([]);
    expect(recipeDetail(family.getTables(), recipeId)).toMatchObject({
      title: "Tomato soup",
      createdById: "alice",
      tags: [],
    });
    expect(names(family, recipeId)).toEqual(["tomatoes", "onion", "salt"]);
  });

  it("copies a recipe under new ids", () => {
    const store = createRecipeStore();
    const recipeId = createRecipe(store, draft(), "alice");
    const copyId = copyRecipe(store, store, recipeId, { createdById: "bob", imageKey: null })!;

    expect(copyId).not.toBe(recipeId);
    expect(recipeDetail(store.getTables(), copyId)).toMatchObject({
      title: "Tomato soup (copy)",
      createdById: "bob",
    });
    expect(names(store, copyId)).toEqual(["tomatoes", "onion", "salt"]);
    expect(readRows(store.getTables(), "ingredients")).toHaveLength(6);
  });
});

describe("tags and folders", () => {
  it("reuses a tag with the same name and counts its recipes", () => {
    const store = createRecipeStore();
    const soup = createRecipe(store, draft(), "alice");
    const stew = createRecipe(store, draft({ title: "Stew" }), "alice");
    const tagId = createCollection(store, "tags", "Winter");

    expect(createCollection(store, "tags", " winter ")).toBe(tagId);
    addToCollection(store, "tags", tagId, [soup, stew, "missing"]);
    expect(collectionList(store.getTables(), "tags")).toEqual([
      { id: tagId, name: "Winter", recipeCount: 2 },
    ]);

    deleteCollection(store, "tags", tagId);
    expect(store.getTable("recipeTags")).toEqual({});
  });

  it("filters the library by search, tags and folder", () => {
    const store = createRecipeStore();
    const soup = createRecipe(store, draft(), "alice");

    const crepes = createRecipe(
      store,
      draft({
        title: "Crêpes",
        ingredients: [{ id: "flour", quantity: 250, unit: "g", name: "flour" }],
        steps: [],
      }),
      "alice",
    );

    const sweet = createCollection(store, "tags", "Sweet");
    const folderId = createCollection(store, "folders", "Weekend");
    addToCollection(store, "tags", sweet, [crepes]);
    addToCollection(store, "folders", folderId, [soup, crepes]);

    const titles = (query: Partial<typeof everyRecipe>) =>
      recipeList(store.getTables(), { ...everyRecipe, ...query }).map((recipe) => recipe.title);

    expect(titles({ search: "crepe" })).toEqual(["Crêpes"]);
    expect(titles({ search: "onion" })).toEqual(["Tomato soup"]);
    expect(titles({ tagIds: [sweet] })).toEqual(["Crêpes"]);
    expect(titles({ folderId, sort: "title", direction: "ascending" })).toEqual([
      "Crêpes",
      "Tomato soup",
    ]);
    expect(collectionList(store.getTables(), "folders")).toEqual([
      { id: folderId, name: "Weekend", recipeCount: 2 },
    ]);
  });
});

describe("meal plan", () => {
  it("keeps one meal per day, the later choice winning across devices", async () => {
    const phone = createRecipeStore();
    const soup = createRecipe(phone, draft(), "alice");
    const stew = createRecipe(phone, draft({ title: "Stew" }), "alice");
    const tablet = createRecipeStore();
    tablet.merge(phone);

    planMeal(phone, "2026-11-13", { recipeId: soup, servings: 2 });
    await new Promise((resolve) => setTimeout(resolve, 5));
    planMeal(tablet, "2026-11-13", { recipeId: stew, servings: null });
    planMeal(tablet, "2026-11-14", { recipeId: soup, servings: null });
    phone.merge(tablet);

    expect(
      mealPlan(phone.getTables(), ["2026-11-12", "2026-11-13", "2026-11-14"]).map((meal) => [
        meal.date,
        meal.recipe.title,
        meal.servings,
      ]),
    ).toEqual([
      ["2026-11-13", "Stew", null],
      ["2026-11-14", "Tomato soup", null],
    ]);

    clearMeal(phone, "2026-11-14");
    deleteRecipes(phone, [stew]);
    expect(mealPlan(phone.getTables(), ["2026-11-13", "2026-11-14"])).toEqual([]);
  });
});
