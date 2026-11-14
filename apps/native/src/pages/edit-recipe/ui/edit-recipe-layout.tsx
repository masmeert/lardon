import { recipeDetail } from "@lardon/recipes";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator } from "react-native";

import { familiesQuery } from "#/entities/family";
import { useFamilyTables } from "#/entities/recipe";
import { type EditorBase, RecipeEditorStack, recipeBase } from "#/features/edit-recipe";
import { EmptyState } from "#/shared/ui";

export function EditRecipeLayout() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const { data: families = [], isPending } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));
  const [base, setBase] = useState<EditorBase>();
  const owner = familyTables.find(({ tables }) => tables.recipes?.[recipeId] !== undefined);
  const recipe = owner && recipeDetail(owner.tables, recipeId);

  if (!base && owner && recipe) {
    setBase(
      recipeBase(
        recipe,
        owner.familyId,
        families.some((family) => family.personal && family.id === owner.familyId),
      ),
    );
  }

  if (base) return <RecipeEditorStack title="Edit recipe" base={base} />;

  if (isPending) return <ActivityIndicator className="flex-1" />;

  return (
    <EmptyState
      icon="book"
      title="This recipe is gone"
      description="It was deleted, maybe on another device."
    />
  );
}
