import { Match } from "effect";

import type { LibraryRecipe } from "./library";

export type ServingsRange = "fewPeople" | "somePeople" | "manyPeople";

export type RecipeFilters = {
  tag: string | null;
  maxMinutes: number | null;
  servings: ServingsRange | null;
  withPhoto: boolean;
};

export const noFilters: RecipeFilters = {
  tag: null,
  maxMinutes: null,
  servings: null,
  withPhoto: false,
};

export const timeOptions = [
  { maxMinutes: 15, label: "Under 15 min" },
  { maxMinutes: 30, label: "Under 30 min" },
  { maxMinutes: 60, label: "Under 1 hour" },
] as const;

export const servingsOptions = [
  { servings: "fewPeople", label: "1 to 2 people" },
  { servings: "somePeople", label: "3 to 4 people" },
  { servings: "manyPeople", label: "5 people or more" },
] as const;

const isInRange = Match.type<{ range: ServingsRange; servings: number }>().pipe(
  Match.when({ range: "fewPeople" }, ({ servings }) => servings <= 2),
  Match.when({ range: "somePeople" }, ({ servings }) => servings >= 3 && servings <= 4),
  Match.when({ range: "manyPeople" }, ({ servings }) => servings >= 5),
  Match.exhaustive,
);

export function activeFilterCount(filters: RecipeFilters) {
  return [filters.maxMinutes, filters.servings, filters.withPhoto || null].filter(
    (filter) => filter !== null,
  ).length;
}

export function filterRecipes(recipes: readonly LibraryRecipe[], filters: RecipeFilters) {
  return recipes.filter((recipe) => {
    const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);

    return (
      (filters.maxMinutes === null || (totalMinutes > 0 && totalMinutes <= filters.maxMinutes)) &&
      (filters.servings === null ||
        (recipe.servings !== undefined &&
          isInRange({ range: filters.servings, servings: recipe.servings }))) &&
      (!filters.withPhoto || recipe.imageKey !== undefined)
    );
  });
}

export type SortField = "updated" | "created" | "title";

export type SortDirection = "ascending" | "descending";

export const sortOptions = [
  {
    field: "updated",
    label: "Last edited",
    directions: { descending: "Newest first", ascending: "Oldest first" },
  },
  {
    field: "created",
    label: "Date added",
    directions: { descending: "Newest first", ascending: "Oldest first" },
  },
  { field: "title", label: "Title", directions: { ascending: "A to Z", descending: "Z to A" } },
] as const;

const comparators = {
  updated: (first: LibraryRecipe, second: LibraryRecipe) => first.updatedAt - second.updatedAt,
  created: (first: LibraryRecipe, second: LibraryRecipe) => first.createdAt - second.createdAt,
  title: (first: LibraryRecipe, second: LibraryRecipe) => first.title.localeCompare(second.title),
};

export function sortRecipes(
  recipes: readonly LibraryRecipe[],
  field: SortField,
  direction: SortDirection,
) {
  return [...recipes].sort(
    (first, second) => (direction === "ascending" ? 1 : -1) * comparators[field](first, second),
  );
}
