import { useQuery } from "@tanstack/react-query";
import { Stack, router } from "expo-router";

import { familiesQuery } from "#/entities/family";
import {
  type LibraryRecipe,
  RecipeCover,
  libraryFolders,
  scopeParams,
  scopedRecipes,
  useFamilyTables,
} from "#/entities/recipe";
import { CollectionList, listLayoutMenu, useListLayout } from "#/shared/ui";

function recipeCount(amount: number) {
  return amount === 1 ? "1 recipe" : `${amount} recipes`;
}

function coverPhoto(recipes: readonly LibraryRecipe[]) {
  const recipe = recipes.find((candidate) => candidate.imageKey);

  return recipe?.imageKey ? (
    <RecipeCover recipe={{ familyId: recipe.familyId, imageKey: recipe.imageKey }} />
  ) : undefined;
}

export function FoldersScreen() {
  const { data: families = [] } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));
  const unsorted = scopedRecipes(familyTables, { kind: "unsorted" }, "");
  const [layout, setLayout] = useListLayout();

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel="More">
          {listLayoutMenu({ layout, onChange: setLayout })}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <CollectionList
        items={[
          ...libraryFolders(familyTables).map((folder) => ({
            key: folder.name,
            title: folder.name,
            photo: coverPhoto(folder.recipes),
            placeholderIcon: "folder" as const,
            facts: [{ label: recipeCount(folder.recipes.length) }],
            onPress: () =>
              router.push({
                pathname: "/collection",
                params: scopeParams({ kind: "folder", name: folder.name }),
              }),
          })),
          {
            key: "unsorted",
            title: "Unsorted",
            photo: coverPhoto(unsorted),
            placeholderIcon: "tray" as const,
            facts: [{ label: recipeCount(unsorted.length) }],
            onPress: () =>
              router.push({ pathname: "/collection", params: scopeParams({ kind: "unsorted" }) }),
          },
        ]}
      />
    </>
  );
}
