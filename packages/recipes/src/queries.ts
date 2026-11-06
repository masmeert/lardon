import { type Store, queryDb } from "@livestore/livestore";

import type { Nutrition } from "./events";
import { type RecipeSchema, recipeTables } from "./schema";

export type RecipeDocument = {
  title: string;
  servings: number | null;
  servingsUnit: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  ingredients: ReadonlyArray<{
    title: string | null;
    ingredients: ReadonlyArray<{
      quantity: number | null;
      unit: string | null;
      name: string;
      note: string | null;
    }>;
  }>;
  steps: ReadonlyArray<{ title: string | null; steps: ReadonlyArray<{ text: string }> }>;
  nutrition: Nutrition | null;
  tags: readonly string[];
  notes: string | null;
  sourceUrl: string | null;
  imageKey: string | null;
};

export const recipes$ = queryDb(recipeTables.recipes.orderBy("updatedAt", "desc"), {
  label: "recipes",
});

export function recipe$(recipeId: string) {
  return queryDb(recipeTables.recipes.where({ id: recipeId }).first({ behaviour: "undefined" }), {
    label: "recipe",
    deps: [recipeId],
  });
}

export function recipeSections$(recipeId: string) {
  return queryDb(
    recipeTables.recipeSections.where({ recipeId, deletedAt: null }).orderBy("position", "asc"),
    { label: "recipeSections", deps: [recipeId] },
  );
}

export function recipeIngredients$(recipeId: string) {
  return queryDb(
    recipeTables.ingredients.where({ recipeId, deletedAt: null }).orderBy("position", "asc"),
    { label: "recipeIngredients", deps: [recipeId] },
  );
}

export function recipeSteps$(recipeId: string) {
  return queryDb(
    recipeTables.steps.where({ recipeId, deletedAt: null }).orderBy("position", "asc"),
    { label: "recipeSteps", deps: [recipeId] },
  );
}

export function readRecipeDocument(
  store: Store<RecipeSchema>,
  recipeId: string,
): RecipeDocument | null {
  const recipe = store.query(recipe$(recipeId));

  if (!recipe) return null;
  const sections = store.query(recipeSections$(recipeId));
  const ingredients = store.query(recipeIngredients$(recipeId));
  const steps = store.query(recipeSteps$(recipeId));

  return {
    title: recipe.title,
    servings: recipe.servings,
    servingsUnit: recipe.servingsUnit,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    ingredients: sections
      .filter((section) => section.kind === "ingredients")
      .map((section) => ({
        title: section.title,
        ingredients: ingredients
          .filter((ingredient) => ingredient.sectionId === section.id)
          .map(({ quantity, unit, name, note }) => ({ quantity, unit, name, note })),
      })),
    steps: sections
      .filter((section) => section.kind === "steps")
      .map((section) => ({
        title: section.title,
        steps: steps.filter((step) => step.sectionId === section.id).map(({ text }) => ({ text })),
      })),
    nutrition: recipe.nutrition,
    tags: recipe.tags,
    notes: recipe.notes,
    sourceUrl: recipe.sourceUrl,
    imageKey: recipe.imageKey,
  };
}
