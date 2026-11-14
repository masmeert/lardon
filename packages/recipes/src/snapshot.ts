import { Schema, Struct } from "effect";

import type { RecipeDetail } from "./queries";
import { tables } from "./tables";

export const RecipeSnapshot = Schema.Struct({
  title: tables.recipes.fields.title,
  servings: tables.recipes.fields.servings,
  prepMinutes: tables.recipes.fields.prepMinutes,
  cookMinutes: tables.recipes.fields.cookMinutes,
  notes: tables.recipes.fields.notes,
  ingredients: Schema.Array(
    Schema.Struct({
      quantity: tables.ingredients.fields.quantity,
      unit: tables.ingredients.fields.unit,
      name: tables.ingredients.fields.name,
    }),
  ).check(Schema.isMaxLength(500)),
  steps: Schema.Array(tables.steps.fields.text).check(Schema.isMaxLength(500)),
});

export type RecipeSnapshot = typeof RecipeSnapshot.Type;

export function recipeSnapshot(recipe: RecipeDetail): RecipeSnapshot {
  return {
    ...Struct.pick(recipe, ["title", "servings", "prepMinutes", "cookMinutes", "notes"]),
    ingredients: recipe.ingredients.map(Struct.pick(["quantity", "unit", "name"])),
    steps: recipe.steps.map((step) => step.text),
  };
}
