import type { MergeableStore } from "tinybase";

import { type Collection, type Stored, collections, readRow, readRows } from "./tables";

export type RecipeSort = "updated" | "created" | "title";

export type RecipeQuery = {
  search: string;
  tagIds: readonly string[];
  folderId: string | null;
  sort: RecipeSort;
  direction: "ascending" | "descending";
};

export const everyRecipe: RecipeQuery = {
  search: "",
  tagIds: [],
  folderId: null,
  sort: "updated",
  direction: "descending",
};

function searchable(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function byPosition<Item extends { id: string; position: string }>(first: Item, second: Item) {
  if (first.position !== second.position) return first.position < second.position ? -1 : 1;

  return first.id < second.id ? -1 : 1;
}

export function ingredientsOf(store: MergeableStore, recipeId: string) {
  return readRows(store, "ingredients")
    .filter((ingredient) => ingredient.recipeId === recipeId)
    .sort(byPosition);
}

export function stepsOf(store: MergeableStore, recipeId: string) {
  return readRows(store, "steps")
    .filter((step) => step.recipeId === recipeId)
    .sort(byPosition);
}

function byName(first: { name: string }, second: { name: string }) {
  return first.name.localeCompare(second.name);
}

function links(store: MergeableStore, collection: Collection) {
  return readRows(store, collections[collection].linkTable).map((link) => ({
    recipeId: link.recipeId,
    ownerId: "tagId" in link ? link.tagId : link.folderId,
  }));
}

export function linkedIds(store: MergeableStore, collection: Collection, recipeId: string) {
  return links(store, collection).flatMap((link) =>
    link.recipeId === recipeId && readRow(store, collection, link.ownerId) ? [link.ownerId] : [],
  );
}

function recipeIdsIn(store: MergeableStore, collection: Collection, ownerId: string) {
  return new Set(
    links(store, collection).flatMap((link) => (link.ownerId === ownerId ? [link.recipeId] : [])),
  );
}

export function recipeDetail(store: MergeableStore, recipeId: string) {
  const recipe = readRow(store, "recipes", recipeId);

  if (!recipe) return undefined;

  const linked = (collection: Collection) => {
    const ownerIds = new Set(linkedIds(store, collection, recipeId));

    return readRows(store, collection)
      .filter((owner) => ownerIds.has(owner.id))
      .sort(byName);
  };

  return {
    ...recipe,
    ingredients: ingredientsOf(store, recipeId),
    steps: stepsOf(store, recipeId),
    tags: linked("tags"),
    folders: linked("folders"),
  };
}

export type RecipeDetail = NonNullable<ReturnType<typeof recipeDetail>>;

const sorters = {
  updated: (first: Stored<"recipes">, second: Stored<"recipes">) =>
    first.updatedAt - second.updatedAt,
  created: (first: Stored<"recipes">, second: Stored<"recipes">) =>
    first.createdAt - second.createdAt,
  title: (first: Stored<"recipes">, second: Stored<"recipes">) =>
    first.title.localeCompare(second.title),
};

export function recipeList(store: MergeableStore, query: RecipeQuery) {
  const terms = searchable(query.search).split(/\s+/).filter(Boolean);
  const requiredTags = query.tagIds.map((tagId) => recipeIdsIn(store, "tags", tagId));
  const inFolder = query.folderId === null ? null : recipeIdsIn(store, "folders", query.folderId);
  const ingredientNames = new Map<string, string[]>();

  if (terms.length > 0) {
    for (const ingredient of readRows(store, "ingredients")) {
      ingredientNames.set(ingredient.recipeId, [
        ...(ingredientNames.get(ingredient.recipeId) ?? []),
        searchable(ingredient.name),
      ]);
    }
  }

  return readRows(store, "recipes")
    .filter(
      (recipe) =>
        requiredTags.every((recipeIds) => recipeIds.has(recipe.id)) &&
        (inFolder === null || inFolder.has(recipe.id)) &&
        terms.every(
          (term) =>
            searchable(recipe.title).includes(term) ||
            (ingredientNames.get(recipe.id) ?? []).some((name) => name.includes(term)),
        ),
    )
    .sort(
      (first, second) =>
        (query.direction === "ascending" ? 1 : -1) * sorters[query.sort](first, second),
    );
}

export function collectionList(store: MergeableStore, collection: Collection) {
  const recipeIds = new Set(readRows(store, "recipes").map((recipe) => recipe.id));

  return readRows(store, collection)
    .map((owner) => ({
      ...owner,
      recipeCount: [...recipeIdsIn(store, collection, owner.id)].filter((recipeId) =>
        recipeIds.has(recipeId),
      ).length,
    }))
    .sort(byName);
}

export function mealPlan(store: MergeableStore, dates: readonly string[]) {
  return dates.flatMap((date) => {
    const meal = readRow(store, "meals", date);
    const recipe = meal && readRow(store, "recipes", meal.recipeId);

    return meal && recipe ? [{ date, recipe, servings: meal.servings }] : [];
  });
}
