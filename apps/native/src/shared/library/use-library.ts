import { everyRecipe, recipeList } from "@lardon/recipes";
import { useSyncExternalStore } from "react";

import { currentLibrary, subscribeToLibrary } from "./library";

export function useLibrary() {
  return useSyncExternalStore(subscribeToLibrary, currentLibrary);
}

export function useRecipes(search: string) {
  const { families } = useLibrary();

  return families
    .flatMap((family) =>
      recipeList(family.store, { ...everyRecipe, search }).map((recipe) => ({ ...recipe, family })),
    )
    .sort((first, second) => second.updatedAt - first.updatedAt);
}
