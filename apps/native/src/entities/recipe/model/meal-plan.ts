import { type PlannedMeal, mealPlan } from "@lardon/recipes";

import type { FamilyTables } from "./library";

export type LibraryMeal = PlannedMeal & { familyId: string };

export function libraryMealPlan(
  familyTables: readonly FamilyTables[],
  range: { from: string; to: string },
): LibraryMeal[] {
  return familyTables
    .flatMap(({ familyId, tables }) =>
      mealPlan(tables, range).map((meal) => ({ ...meal, familyId })),
    )
    .sort((first, second) => (first.date < second.date ? -1 : 1));
}
