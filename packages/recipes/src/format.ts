import { type UnitCode, type UnitSystem, convertAmount } from "./units";

const fractions: readonly (readonly [number, string])[] = [
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

export function formatQuantity(quantity: number) {
  const whole = Math.floor(quantity);
  const remainder = quantity - whole;

  if (remainder < 0.01) return String(whole);

  if (remainder > 0.99) return String(whole + 1);

  const fraction = fractions.find(([value]) => Math.abs(value - remainder) < 0.01);

  if (fraction) return whole === 0 ? fraction[1] : `${whole}${fraction[1]}`;

  return String(Math.round(quantity * 100) / 100);
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);

  if (hours === 0) return `${minutes} min`;

  return minutes % 60 === 0 ? `${hours} h` : `${hours} h ${minutes % 60} min`;
}

export function formatAmount(
  ingredient: { quantity?: number; unit?: UnitCode },
  scale: number,
  unitSystem: UnitSystem,
) {
  if (ingredient.quantity === undefined) return ingredient.unit ?? "";

  const { quantity, unit } = convertAmount(
    ingredient.quantity * scale,
    ingredient.unit ?? null,
    unitSystem,
  );

  return unit ? `${formatQuantity(quantity)} ${unit}` : formatQuantity(quantity);
}

export function formatFacts(
  recipe: { servings?: number; prepMinutes?: number; cookMinutes?: number },
  scale: number,
) {
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);

  return [
    totalMinutes > 0 ? formatDuration(totalMinutes) : null,
    recipe.servings === undefined
      ? scale === 1
        ? null
        : `${formatQuantity(scale)} times the recipe`
      : recipe.servings * scale === 1
        ? "1 serving"
        : `${formatQuantity(recipe.servings * scale)} servings`,
  ].filter((fact) => fact !== null);
}
