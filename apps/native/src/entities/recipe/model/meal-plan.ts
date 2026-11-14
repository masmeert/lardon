import { type PlannedMeal, mealPlan } from "@lardon/recipes";

import type { FamilyTables } from "./library";

export type LibraryMeal = PlannedMeal & { familyId: string };

function orderKey(meal: LibraryMeal) {
  return `${meal.date} ${meal.position} ${meal.id}`;
}

export function libraryMealPlan(
  familyTables: readonly FamilyTables[],
  range: { from: string; to: string },
): LibraryMeal[] {
  return familyTables
    .flatMap(({ familyId, tables }) =>
      mealPlan(tables, range).map((meal) => ({ ...meal, familyId })),
    )
    .sort((first, second) => (orderKey(first) < orderKey(second) ? -1 : 1));
}
