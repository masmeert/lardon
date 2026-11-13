import {
  type Collection,
  type Stored,
  collectionList,
  everyRecipe,
  linkedIds,
  readRows,
  recipeList,
} from "@lardon/recipes";
import { Match } from "effect";
import type { Tables } from "tinybase";

import type { RecipeScope } from "./recipe-scope";

export type FamilyTables = { familyId: string; tables: Tables };

export type LibraryRecipe = Stored<"recipes"> & { familyId: string };

function idsNamed(tables: Tables, collection: Collection, name: string) {
  return readRows(tables, collection).flatMap((owner) =>
    owner.name.toLocaleLowerCase() === name.toLocaleLowerCase() ? [owner.id] : [],
  );
}

function familyRecipes(familyId: string, tables: Tables, scope: RecipeScope, search: string) {
  const query = { ...everyRecipe, search };

  const recipes = Match.value(scope).pipe(
    Match.discriminators("kind")({
      folder: ({ name }) =>
        idsNamed(tables, "folders", name).flatMap((folderId) =>
          recipeList(tables, { ...query, folderId }),
        ),
      tag: ({ name }) =>
        idsNamed(tables, "tags", name).flatMap((tagId) =>
          recipeList(tables, { ...query, tagIds: [tagId] }),
        ),
    }),
    Match.orElse(() => recipeList(tables, query)),
  );

  return recipes
    .filter(
      (recipe) => scope.kind !== "unsorted" || linkedIds(tables, "folders", recipe.id).length === 0,
    )
    .map((recipe) => ({ ...recipe, familyId }));
}

export function scopedRecipes(
  familyTables: readonly FamilyTables[],
  scope: RecipeScope,
  search: string,
): LibraryRecipe[] {
  return familyTables
    .flatMap(({ familyId, tables }) => familyRecipes(familyId, tables, scope, search))
    .sort((first, second) => second.updatedAt - first.updatedAt);
}

export function libraryFolders(familyTables: readonly FamilyTables[]) {
  const names = new Map<string, string>();

  for (const { tables } of familyTables) {
    for (const folder of readRows(tables, "folders")) {
      names.set(
        folder.name.toLocaleLowerCase(),
        names.get(folder.name.toLocaleLowerCase()) ?? folder.name,
      );
    }
  }

  return [...names.values()]
    .sort((first, second) => first.localeCompare(second))
    .map((name) => ({ name, recipes: scopedRecipes(familyTables, { kind: "folder", name }, "") }));
}

export function libraryTags(familyTables: readonly FamilyTables[]) {
  const tags = new Map<string, { name: string; recipeCount: number }>();

  for (const { tables } of familyTables) {
    for (const tag of collectionList(tables, "tags")) {
      const key = tag.name.toLocaleLowerCase();

      tags.set(key, {
        name: tags.get(key)?.name ?? tag.name,
        recipeCount: (tags.get(key)?.recipeCount ?? 0) + tag.recipeCount,
      });
    }
  }

  return [...tags.values()].sort((first, second) => first.name.localeCompare(second.name));
}
