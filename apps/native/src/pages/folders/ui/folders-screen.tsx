import { useQuery } from "@tanstack/react-query";
import { Stack, router } from "expo-router";

import { familiesQuery } from "#/entities/family";
import {
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
            cover: (sizePt: number) => (
              <RecipeCover
                recipe={folder.recipes.find((recipe) => recipe.imageKey)}
                sizePt={sizePt}
                placeholderIcon="folder"
              />
            ),
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
            cover: (sizePt: number) => (
              <RecipeCover
                recipe={unsorted.find((recipe) => recipe.imageKey)}
                sizePt={sizePt}
                placeholderIcon="tray"
              />
            ),
            facts: [{ label: recipeCount(unsorted.length) }],
            onPress: () =>
              router.push({ pathname: "/collection", params: scopeParams({ kind: "unsorted" }) }),
          },
        ]}
      />
    </>
  );
}
