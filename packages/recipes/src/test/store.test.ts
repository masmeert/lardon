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
import {
  collectionList,
  everyRecipe,
  mealPlan,
  recipeDetail,
  recipeList,
  savedCopyOf,
} from "../queries";
import { recipeSnapshot, snapshotDraft } from "../snapshot";
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
    expect(isValidCell("meals", "2026-11-13", "servings", 4)).toBe(false);
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
  it("saves someone else's snapshot as a new private recipe that remembers where it came from", () => {
    const store = createRecipeStore();
    const family = createRecipeStore();
    const original = createRecipe(store, draft({ notes: "Use ripe tomatoes." }), "alice");
    const snapshot = recipeSnapshot(recipeDetail(store.getTables(), original)!);

    const copy = createRecipe(
      store,
      snapshotDraft(snapshot, "6f1c3a52-8f7d-4c3e-9a51-2b0d7e9c4a10.jpg"),
      "bob",
      "published-soup",
    );

    const saved = recipeDetail(store.getTables(), copy)!;

    expect(recipeSnapshot(saved)).toEqual(snapshot);
    expect(saved).toMatchObject({
      createdById: "bob",
      visibility: "private",
      savedFromId: "published-soup",
      imageKey: "6f1c3a52-8f7d-4c3e-9a51-2b0d7e9c4a10.jpg",
    });
    expect(savedCopyOf(store.getTables(), "published-soup")?.id).toBe(copy);
    expect(savedCopyOf(store.getTables(), "published-stew")).toBeUndefined();

    moveRecipe(store, family, copy, null);
    expect(savedCopyOf(store.getTables(), "published-soup")).toBeUndefined();
    expect(savedCopyOf(family.getTables(), "published-soup")?.id).toBe(copy);
  });

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
    planMeal(store, "2026-11-13", recipeId);

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

  it("moves a recipe to another store under the same id, keeping its tags and folders by name", () => {
    const personal = createRecipeStore();
    const family = createRecipeStore();
    const recipeId = createRecipe(personal, draft(), "alice");
    addToCollection(personal, "tags", createCollection(personal, "tags", "Soup"), [recipeId]);
    addToCollection(personal, "folders", createCollection(personal, "folders", "Winter"), [
      recipeId,
    ]);
    const winterId = createCollection(family, "folders", "winter");

    expect(moveRecipe(personal, family, recipeId, null)).toBe(true);

    expect(recipeList(personal.getTables(), everyRecipe)).toEqual([]);
    expect(recipeDetail(family.getTables(), recipeId)).toMatchObject({
      title: "Tomato soup",
      createdById: "alice",
      tags: [expect.objectContaining({ name: "Soup" })],
      folders: [{ id: winterId, name: "winter" }],
    });
    expect(names(family, recipeId)).toEqual(["tomatoes", "onion", "salt"]);
  });

  it("drops a recipe's planned meals when it moves to another store", () => {
    const personal = createRecipeStore();
    const family = createRecipeStore();
    const recipeId = createRecipe(family, draft(), "alice");
    planMeal(family, "2026-11-13", recipeId);

    moveRecipe(family, personal, recipeId, null);

    expect(family.getTable("meals")).toEqual({});
    expect(personal.getTable("meals")).toEqual({});
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

    planMeal(phone, "2026-11-13", soup);
    await new Promise((resolve) => setTimeout(resolve, 5));
    planMeal(tablet, "2026-11-13", stew);
    planMeal(tablet, "2026-11-14", soup);
    phone.merge(tablet);

    expect(
      mealPlan(phone.getTables(), { from: "2026-11-12", to: "2026-11-14" }).map((meal) => [
        meal.date,
        meal.recipe.title,
      ]),
    ).toEqual([
      ["2026-11-13", "Stew"],
      ["2026-11-14", "Tomato soup"],
    ]);

    clearMeal(phone, "2026-11-14");
    deleteRecipes(phone, [stew]);
    expect(mealPlan(phone.getTables(), { from: "2026-11-13", to: "2026-11-14" })).toEqual([]);
  });
});
