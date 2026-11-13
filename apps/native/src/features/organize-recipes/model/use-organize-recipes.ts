import {
  type Collection,
  addToCollection,
  createCollection,
  deleteRecipes,
  moveRecipe,
  readRows,
  removeFromCollection,
} from "@lardon/recipes";
import { useMutation, useQuery } from "@tanstack/react-query";

import { familiesQuery, useFamilyStores } from "#/entities/family";
import type { LibraryRecipe } from "#/entities/recipe";
import { requestApi } from "#/shared/api";

function byFamily(recipes: readonly LibraryRecipe[]) {
  const groups = new Map<string, string[]>();

  for (const recipe of recipes) {
    groups.set(recipe.familyId, [...(groups.get(recipe.familyId) ?? []), recipe.id]);
  }

  return groups;
}

export function useOrganizeRecipes() {
  const familyStore = useFamilyStores();
  const { data: families = [] } = useQuery(familiesQuery);
  const personalId = families.find((family) => family.personal)?.id;
  const sharedId = families.find((family) => !family.personal)?.id;

  function addTo(collection: Collection, name: string, recipes: readonly LibraryRecipe[]) {
    for (const [familyId, recipeIds] of byFamily(recipes)) {
      const store = familyStore(familyId);

      if (store)
        addToCollection(store, collection, createCollection(store, collection, name), recipeIds);
    }
  }

  function removeFrom(collection: Collection, name: string, recipes: readonly LibraryRecipe[]) {
    for (const [familyId, recipeIds] of byFamily(recipes)) {
      const store = familyStore(familyId);

      for (const owner of store ? readRows(store.getTables(), collection) : []) {
        if (store && owner.name.toLocaleLowerCase() === name.toLocaleLowerCase()) {
          removeFromCollection(store, collection, owner.id, recipeIds);
        }
      }
    }
  }

  function remove(recipes: readonly LibraryRecipe[]) {
    for (const [familyId, recipeIds] of byFamily(recipes)) {
      const store = familyStore(familyId);

      if (store) deleteRecipes(store, recipeIds);
    }
  }

  const move = useMutation({
    mutationFn: async ({
      recipes,
      isPrivate,
    }: {
      recipes: readonly LibraryRecipe[];
      isPrivate: boolean;
    }) => {
      const targetId = isPrivate ? personalId : sharedId;
      const target = targetId ? familyStore(targetId) : undefined;

      if (!targetId || !target) throw new Error("There's no family to move these recipes to");

      for (const recipe of recipes.filter((candidate) => candidate.familyId !== targetId)) {
        const source = familyStore(recipe.familyId);
        const imageKey = recipe.imageKey;

        const copiedImageKey = imageKey
          ? (
              await requestApi((client) =>
                client.images.copy({
                  params: { familyId: targetId },
                  payload: { sourceFamilyId: recipe.familyId, imageKey },
                }),
              )
            ).imageKey
          : null;

        if (source) moveRecipe(source, target, recipe.id, copiedImageKey);
      }
    },
  });

  return {
    hasFamily: sharedId !== undefined,
    personalId,
    addTo,
    removeFrom,
    remove,
    move,
  };
}
