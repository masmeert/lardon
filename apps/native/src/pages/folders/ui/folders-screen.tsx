import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Text } from "react-native";

import { familiesQuery } from "#/entities/family";
import {
  RecipeFan,
  libraryFolders,
  scopeParams,
  scopedRecipes,
  useFamilyTables,
} from "#/entities/recipe";
import { CollectionList, ListLayoutMenu } from "#/shared/ui";

function recipeCount(amount: number) {
  return amount === 1 ? "1 recipe" : `${amount} recipes`;
}

export function FoldersScreen() {
  const { data: families = [] } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));
  const unsorted = scopedRecipes(familyTables, { kind: "unsorted" }, "");

  return (
    <>
      <ListLayoutMenu />
      <CollectionList
        items={[
          ...libraryFolders(familyTables).map((folder) => ({
            key: folder.name,
            title: folder.name,
            cover: (sizePt: number) => (
              <RecipeFan recipes={folder.recipes} icon="folder" sizePt={sizePt} />
            ),
            details: (
              <Text className="text-caption text-muted">{recipeCount(folder.recipes.length)}</Text>
            ),
            onPress: () =>
              router.push({
                pathname: "/collection",
                params: scopeParams({ kind: "folder", name: folder.name }),
              }),
          })),
          {
            key: "unsorted",
            title: "Unsorted",
            cover: (sizePt: number) => <RecipeFan recipes={unsorted} icon="tray" sizePt={sizePt} />,
            details: (
              <Text className="text-caption text-muted">{recipeCount(unsorted.length)}</Text>
            ),
            onPress: () =>
              router.push({ pathname: "/collection", params: scopeParams({ kind: "unsorted" }) }),
          },
        ]}
      />
    </>
  );
}
