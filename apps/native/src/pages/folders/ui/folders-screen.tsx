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
            key: `${folder.familyId}:${folder.id}`,
            title: folder.name,
            cover: (sizePt: number) => (
              <RecipeFan recipes={folder.recipes} icon="folder" sizePt={sizePt} />
            ),
            details: (
              <Text className="text-caption text-muted">
                {[
                  recipeCount(folder.recipeCount),
                  families.length > 1
                    ? families.find((family) => family.id === folder.familyId)?.name
                    : undefined,
                ]
                  .filter((detail) => detail !== undefined)
                  .join(", ")}
              </Text>
            ),
            onPress: () =>
              router.push({
                pathname: "/collection",
                params: scopeParams({
                  kind: "folder",
                  familyId: folder.familyId,
                  folderId: folder.id,
                }),
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
