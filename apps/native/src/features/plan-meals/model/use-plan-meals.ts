import { clearMeal, planMeal } from "@lardon/recipes";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { familiesQuery, useFamilyStores } from "#/entities/family";
import { libraryMealPlan, useFamilyTables } from "#/entities/recipe";
import { addDays, calendarDay } from "#/shared/lib";

export function usePlanMeals() {
  const familyStore = useFamilyStores();
  const { data: families = [] } = useQuery(familiesQuery);

  const planFamilyId =
    families.find((family) => !family.personal)?.id ??
    families.find((family) => family.personal)?.id;

  const familyTables = useFamilyTables(planFamilyId === undefined ? [] : [planFamilyId]);
  const store = planFamilyId === undefined ? undefined : familyStore(planFamilyId);

  function mealsIn(range: { from: string; to: string }) {
    return libraryMealPlan(familyTables, range);
  }

  function plan(date: string, recipeId: string) {
    if (!store) return false;

    planMeal(store, date, recipeId);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    return true;
  }

  function move(from: string, to: string) {
    const [moving] = mealsIn({ from, to: from });
    const [staying] = mealsIn({ from: to, to });

    if (!store || !moving) return;

    store.transaction(() => {
      planMeal(store, to, moving.recipe.id);

      if (staying) planMeal(store, from, staying.recipe.id);
      else clearMeal(store, from);
    });
    void Haptics.selectionAsync();
  }

  function remove(dates: readonly string[]) {
    if (!store) return;

    store.transaction(() => {
      for (const date of dates) clearMeal(store, date);
    });
    void Haptics.selectionAsync();
  }

  function weekPlan() {
    const today = calendarDay(new Date());

    return mealsIn({ from: today, to: addDays(today, 6) });
  }

  function toggle(date: string, recipeId: string) {
    if (mealsIn({ from: date, to: date })[0]?.recipe.id === recipeId) remove([date]);
    else plan(date, recipeId);
  }

  return { planFamilyId, mealsIn, plan, move, remove, weekPlan, toggle };
}
