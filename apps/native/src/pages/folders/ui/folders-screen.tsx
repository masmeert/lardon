import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";

import { familiesQuery } from "#/entities/family";
import {
  RecipeFan,
  libraryFolders,
  scopeParams,
  scopedRecipes,
  useFamilyTables,
} from "#/entities/recipe";
import { CollectionTile } from "#/shared/ui";

export function FoldersScreen() {
  const { data: families = [] } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));
  const unsorted = scopedRecipes(familyTables, { kind: "unsorted" }, "");

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-16">
      <View className="flex-row flex-wrap gap-x-3 gap-y-5 px-5 pt-4">
        {libraryFolders(familyTables).map((folder) => (
          <CollectionTile
            key={`${folder.familyId}:${folder.id}`}
            name={folder.name}
            recipeCount={folder.recipeCount}
            cover={<RecipeFan recipes={folder.recipes} icon="folder" />}
            onPress={() =>
              router.push({
                pathname: "/collection",
                params: scopeParams({
                  kind: "folder",
                  familyId: folder.familyId,
                  folderId: folder.id,
                }),
              })
            }
          />
        ))}
        <CollectionTile
          name="Unsorted"
          recipeCount={unsorted.length}
          cover={<RecipeFan recipes={unsorted} icon="tray" />}
          onPress={() =>
            router.push({ pathname: "/collection", params: scopeParams({ kind: "unsorted" }) })
          }
        />
      </View>
    </ScrollView>
  );
}
