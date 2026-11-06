import type { Nutrition } from "../events";
import type { RecipeDocument } from "../queries";

const FRACTIONS: [number, string][] = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
];

const NUTRIENTS: [keyof Nutrition, string, string][] = [
  ["calories", "Calories", "kcal"],
  ["protein", "Protein", "g"],
  ["carbohydrates", "Carbohydrates", "g"],
  ["sugar", "Sugar", "g"],
  ["fat", "Fat", "g"],
  ["saturatedFat", "Saturated fat", "g"],
  ["fiber", "Fiber", "g"],
  ["sodium", "Sodium", "mg"],
];

export function formatQuantity(quantity: number) {
  const whole = Math.floor(quantity);
  const remainder = quantity - whole;
  if (remainder < 0.01) return String(whole);
  if (remainder > 0.99) return String(whole + 1);
  const fraction = FRACTIONS.find(([value]) => Math.abs(value - remainder) < 0.01);
  if (fraction) return whole === 0 ? fraction[1] : `${whole}${fraction[1]}`;
  return String(Math.round(quantity * 100) / 100);
}

export function formatIngredient(
  ingredient: RecipeDocument["ingredients"][number]["ingredients"][number],
) {
  const amount = [
    ingredient.quantity === null ? null : formatQuantity(ingredient.quantity),
    ingredient.unit,
  ]
    .filter(Boolean)
    .join(" ");
  const line = amount ? `${amount} ${ingredient.name}` : ingredient.name;
  return ingredient.note ? `${line}, ${ingredient.note}` : line;
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes} min`;
  return minutes % 60 === 0 ? `${hours} h` : `${hours} h ${minutes % 60} min`;
}

export function formatMeta(recipe: RecipeDocument) {
  const parts: string[] = [];
  if (recipe.servings !== null) {
    parts.push(
      recipe.servingsUnit
        ? `Makes ${formatQuantity(recipe.servings)} ${recipe.servingsUnit}`
        : `Serves ${formatQuantity(recipe.servings)}`,
    );
  }
  const { prepTimeMinutes, cookTimeMinutes } = recipe;
  if (prepTimeMinutes !== null) parts.push(`Prep ${formatDuration(prepTimeMinutes)}`);
  if (cookTimeMinutes !== null) parts.push(`Cook ${formatDuration(cookTimeMinutes)}`);
  if (prepTimeMinutes && cookTimeMinutes) {
    parts.push(`Total ${formatDuration(prepTimeMinutes + cookTimeMinutes)}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function nutritionRows(nutrition: Nutrition | null) {
  if (!nutrition) return [];
  return NUTRIENTS.flatMap(([key, label, unit]) => {
    const value = nutrition[key];
    if (value === null || value === undefined) return [];
    return [{ label, value: `${Math.round(value * 10) / 10} ${unit}` }];
  });
}

export function hasIngredients(recipe: RecipeDocument) {
  return recipe.ingredients.some((section) => section.ingredients.length > 0);
}

export function hasSteps(recipe: RecipeDocument) {
  return recipe.steps.some((section) => section.steps.length > 0);
}
