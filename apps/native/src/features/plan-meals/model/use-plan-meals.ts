import { clearMeal, planMeal } from "@lardon/recipes";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { familiesQuery, useFamilyStores } from "#/entities/family";
import { type LibraryMeal, libraryMealPlan, useFamilyTables } from "#/entities/recipe";
import { addDays, calendarDay } from "#/shared/lib";

export function usePlanMeals() {
  const familyStore = useFamilyStores();
  const { data: families = [] } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));

  function mealsOn(date: string) {
    return libraryMealPlan(familyTables, { from: date, to: date });
  }

  function remove(meals: readonly LibraryMeal[]) {
    for (const meal of meals) {
      const store = familyStore(meal.familyId);

      if (store) clearMeal(store, meal.date);
    }
  }

  function place(meals: readonly LibraryMeal[], date: string) {
    for (const meal of meals) {
      const store = familyStore(meal.familyId);

      if (store) planMeal(store, date, meal.recipe.id);
    }
  }

  function plan(date: string, recipe: { id: string; familyId: string }) {
    const store = familyStore(recipe.familyId);

    if (!store) return false;

    remove(mealsOn(date));
    planMeal(store, date, recipe.id);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    return true;
  }

  function move(from: string, to: string) {
    const moving = mealsOn(from);
    const staying = mealsOn(to);

    remove([...moving, ...staying]);
    place(moving, to);
    place(staying, from);
    void Haptics.selectionAsync();
  }

  function weekPlan() {
    const today = calendarDay(new Date());

    return libraryMealPlan(familyTables, { from: today, to: addDays(today, 6) });
  }

  function toggle(date: string, recipe: { id: string; familyId: string }) {
    if (mealsOn(date).some((meal) => meal.recipe.id === recipe.id)) remove(mealsOn(date));
    else plan(date, recipe);
  }

  return { plan, move, remove, weekPlan, toggle };
}
