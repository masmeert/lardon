import type { MergeableStore } from "tinybase";

import { type Stored, readRow, readRows } from "./tables";

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

export function linkedIds(
  store: MergeableStore,
  tableId: "recipeTags" | "recipeFolders",
  recipeId: string,
) {
  const ownerTable = tableId === "recipeTags" ? "tags" : "folders";

  return readRows(store, tableId).flatMap((link) => {
    const ownerId = "tagId" in link ? link.tagId : link.folderId;

    return link.recipeId === recipeId && readRow(store, ownerTable, ownerId) ? [ownerId] : [];
  });
}

export function recipeDetail(store: MergeableStore, recipeId: string) {
  const recipe = readRow(store, "recipes", recipeId);

  if (!recipe) return undefined;
  const tagIds = new Set(linkedIds(store, "recipeTags", recipeId));
  const folderIds = new Set(linkedIds(store, "recipeFolders", recipeId));

  return {
    ...recipe,
    ingredients: ingredientsOf(store, recipeId),
    steps: stepsOf(store, recipeId),
    tags: readRows(store, "tags")
      .filter((tag) => tagIds.has(tag.id))
      .sort((first, second) => first.name.localeCompare(second.name)),
    folders: readRows(store, "folders")
      .filter((folder) => folderIds.has(folder.id))
      .sort((first, second) => first.name.localeCompare(second.name)),
  };
}

export type RecipeDetail = NonNullable<ReturnType<typeof recipeDetail>>;

function recipeIdsLinkedTo(
  store: MergeableStore,
  tableId: "recipeTags" | "recipeFolders",
  ownerId: string,
) {
  return new Set(
    readRows(store, tableId).flatMap((link) =>
      ("tagId" in link ? link.tagId : link.folderId) === ownerId ? [link.recipeId] : [],
    ),
  );
}

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
  const requiredTags = query.tagIds.map((tagId) => recipeIdsLinkedTo(store, "recipeTags", tagId));

  const inFolder =
    query.folderId === null ? null : recipeIdsLinkedTo(store, "recipeFolders", query.folderId);

  const ingredientNames = new Map<string, string[]>();

  if (terms.length > 0) {
    for (const ingredient of readRows(store, "ingredients")) {
      ingredientNames.set(ingredient.recipeId, [
        ...(ingredientNames.get(ingredient.recipeId) ?? []),
        searchable(ingredient.name),
      ]);
    }
  }

  const direction = query.direction === "ascending" ? 1 : -1;

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
    .sort((first, second) => direction * sorters[query.sort](first, second));
}

function withRecipeCounts<Owner extends { id: string; name: string }>(
  store: MergeableStore,
  owners: readonly Owner[],
  tableId: "recipeTags" | "recipeFolders",
) {
  const recipeIds = new Set(readRows(store, "recipes").map((recipe) => recipe.id));

  return owners
    .map((owner) => ({
      ...owner,
      recipeCount: [...recipeIdsLinkedTo(store, tableId, owner.id)].filter((recipeId) =>
        recipeIds.has(recipeId),
      ).length,
    }))
    .sort((first, second) => first.name.localeCompare(second.name));
}

export function tagList(store: MergeableStore) {
  return withRecipeCounts(store, readRows(store, "tags"), "recipeTags");
}

export function folderList(store: MergeableStore) {
  return withRecipeCounts(store, readRows(store, "folders"), "recipeFolders");
}

export function mealPlan(store: MergeableStore, dates: readonly string[]) {
  return dates.flatMap((date) => {
    const meal = readRow(store, "meals", date);
    const recipe = meal && readRow(store, "recipes", meal.recipeId);

    return meal && recipe ? [{ date, recipe, servings: meal.servings }] : [];
  });
}
