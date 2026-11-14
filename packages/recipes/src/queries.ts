import type { Tables } from "tinybase";

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

export function ingredientsOf(content: Tables, recipeId: string) {
  return readRows(content, "ingredients")
    .filter((ingredient) => ingredient.recipeId === recipeId)
    .sort(byPosition);
}

export function stepsOf(content: Tables, recipeId: string) {
  return readRows(content, "steps")
    .filter((step) => step.recipeId === recipeId)
    .sort(byPosition);
}

function byName(first: { name: string }, second: { name: string }) {
  return first.name.localeCompare(second.name);
}

function links(content: Tables, collection: Collection) {
  return readRows(content, collections[collection].linkTable).map((link) => ({
    recipeId: link.recipeId,
    ownerId: "tagId" in link ? link.tagId : link.folderId,
  }));
}

export function linkedIds(content: Tables, collection: Collection, recipeId: string) {
  return links(content, collection).flatMap((link) =>
    link.recipeId === recipeId && readRow(content, collection, link.ownerId) ? [link.ownerId] : [],
  );
}

function recipeIdsIn(content: Tables, collection: Collection, ownerId: string) {
  return new Set(
    links(content, collection).flatMap((link) => (link.ownerId === ownerId ? [link.recipeId] : [])),
  );
}

export function recipeDetail(content: Tables, recipeId: string) {
  const recipe = readRow(content, "recipes", recipeId);

  if (!recipe) return undefined;

  const linked = (collection: Collection) => {
    const ownerIds = new Set(linkedIds(content, collection, recipeId));

    return readRows(content, collection)
      .filter((owner) => ownerIds.has(owner.id))
      .sort(byName);
  };

  return {
    ...recipe,
    ingredients: ingredientsOf(content, recipeId),
    steps: stepsOf(content, recipeId),
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

export function recipeList(content: Tables, query: RecipeQuery) {
  const terms = searchable(query.search).split(/\s+/).filter(Boolean);
  const requiredTags = query.tagIds.map((tagId) => recipeIdsIn(content, "tags", tagId));
  const inFolder = query.folderId === null ? null : recipeIdsIn(content, "folders", query.folderId);
  const ingredientNames = new Map<string, string[]>();

  if (terms.length > 0) {
    for (const ingredient of readRows(content, "ingredients")) {
      ingredientNames.set(ingredient.recipeId, [
        ...(ingredientNames.get(ingredient.recipeId) ?? []),
        searchable(ingredient.name),
      ]);
    }
  }

  return readRows(content, "recipes")
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

export function collectionList(content: Tables, collection: Collection) {
  const recipeIds = new Set(readRows(content, "recipes").map((recipe) => recipe.id));

  return readRows(content, collection)
    .map((owner) => ({
      ...owner,
      recipeCount: [...recipeIdsIn(content, collection, owner.id)].filter((recipeId) =>
        recipeIds.has(recipeId),
      ).length,
    }))
    .sort(byName);
}

export function mealPlan(content: Tables, range: { from: string; to: string }) {
  return Object.keys(content.meals ?? {})
    .filter((date) => range.from <= date && date <= range.to)
    .sort()
    .flatMap((date) => {
      const meal = readRow(content, "meals", date);
      const recipe = meal && readRow(content, "recipes", meal.recipeId);

      return recipe ? [{ date, recipe }] : [];
    });
}

export type PlannedMeal = ReturnType<typeof mealPlan>[number];
