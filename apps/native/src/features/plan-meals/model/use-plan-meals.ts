import { moveMeal, planMeal, removeMeals } from "@lardon/recipes";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { familiesQuery, useFamilyStores } from "#/entities/family";
import { type LibraryMeal, libraryMealPlan, useFamilyTables } from "#/entities/recipe";
import { addDays, calendarDay } from "#/shared/lib";

export function usePlanMeals() {
  const familyStore = useFamilyStores();
  const { data: families = [] } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));

  function lastPosition(date: string) {
    return libraryMealPlan(familyTables, { from: date, to: date }).at(-1)?.position ?? null;
  }

  function plan(date: string, recipe: { id: string; familyId: string }) {
    const store = familyStore(recipe.familyId);

    if (!store) return false;

    planMeal(store, date, recipe.id, lastPosition(date));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    return true;
  }

  function move(meals: readonly LibraryMeal[], date: string) {
    let after = lastPosition(date);

    for (const meal of meals) {
      const store = familyStore(meal.familyId);

      if (store) after = moveMeal(store, meal.id, date, after);
    }

    void Haptics.selectionAsync();
  }

  function remove(meals: readonly LibraryMeal[]) {
    for (const meal of meals) {
      const store = familyStore(meal.familyId);

      if (store) removeMeals(store, [meal.id]);
    }
  }

  function mealsOf(recipeId: string, range: { from: string; to: string }) {
    return libraryMealPlan(familyTables, range).filter((meal) => meal.recipe.id === recipeId);
  }

  function plannedDays(recipeId: string) {
    const today = calendarDay(new Date());

    return mealsOf(recipeId, { from: today, to: addDays(today, 6) }).map((meal) => meal.date);
  }

  function toggle(date: string, recipe: { id: string; familyId: string }) {
    const planned = mealsOf(recipe.id, { from: date, to: date });

    if (planned.length > 0) remove(planned);
    else plan(date, recipe);
  }

  return { plan, move, remove, plannedDays, toggle };
}
