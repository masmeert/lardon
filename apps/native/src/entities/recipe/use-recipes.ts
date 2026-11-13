import { everyRecipe, recipeList } from "@lardon/recipes";
import { useTables } from "tinybase/ui-react";

export function useRecipes(familyId: string, search: string) {
  return recipeList(useTables(familyId), { ...everyRecipe, search });
}
