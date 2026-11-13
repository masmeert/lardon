import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Text } from "react-native";

import { FamilyFaces, familiesQuery } from "#/entities/family";
import { scopeParams, scopedRecipes, useFamilyTables } from "#/entities/recipe";
import { CollectionList, ListLayoutMenu } from "#/shared/ui";

function count(amount: number, singular: string, plural: string) {
  return `${amount} ${amount === 1 ? singular : plural}`;
}

export function FamiliesScreen() {
  const { data: families = [] } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));

  return (
    <>
      <ListLayoutMenu />
      <CollectionList
        items={families.map((family) => ({
          key: family.id,
          title: family.name,
          cover: (sizePt) => <FamilyFaces familyId={family.id} sizePt={sizePt} />,
          details: (
            <Text className="text-caption text-muted">
              {count(family.memberCount, "member", "members")},{" "}
              {count(
                scopedRecipes(familyTables, { kind: "family", familyId: family.id }, "").length,
                "recipe",
                "recipes",
              )}
            </Text>
          ),
          onPress: () =>
            router.push({
              pathname: "/collection",
              params: scopeParams({ kind: "family", familyId: family.id }),
            }),
        }))}
      />
    </>
  );
}
