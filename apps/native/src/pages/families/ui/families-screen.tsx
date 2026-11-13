import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";

import { FamilyFaces, familiesQuery } from "#/entities/family";
import { scopeParams, scopedRecipes, useFamilyTables } from "#/entities/recipe";
import { CollectionTile } from "#/shared/ui";

export function FamiliesScreen() {
  const { data: families = [] } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-16">
      <View className="flex-row flex-wrap gap-x-3 gap-y-5 px-5 pt-4">
        {families.map((family) => (
          <CollectionTile
            key={family.id}
            name={family.name}
            recipeCount={
              scopedRecipes(familyTables, { kind: "family", familyId: family.id }, "").length
            }
            cover={<FamilyFaces familyId={family.id} />}
            onPress={() =>
              router.push({
                pathname: "/collection",
                params: scopeParams({ kind: "family", familyId: family.id }),
              })
            }
          />
        ))}
      </View>
    </ScrollView>
  );
}
