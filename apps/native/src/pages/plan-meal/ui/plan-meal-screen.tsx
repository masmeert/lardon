import { useQuery } from "@tanstack/react-query";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { familiesQuery } from "#/entities/family";
import { RecipeCover, recipeFacts, scopedRecipes, useFamilyTables } from "#/entities/recipe";
import { usePlanMeals } from "#/features/plan-meals";
import { relativeDayName, useThemeColors, useToday } from "#/shared/lib";
import { CollectionList, EmptyState, InlineError } from "#/shared/ui";

export function PlanMealScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const today = useToday();
  const { accent, foreground, background } = useThemeColors("accent", "foreground", "background");
  const { data: families = [], isPending } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));
  const planMeals = usePlanMeals();
  const [search, setSearch] = useState("");
  const [hasFailed, setHasFailed] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          title: relativeDayName(date, today),
          headerTintColor: foreground,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: background },
          headerSearchBarOptions: {
            placeholder: "Search recipes",
            tintColor: accent,
            hideWhenScrolling: false,
            onChangeText: (event) => setSearch(event.nativeEvent.text),
          },
        }}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" accessibilityLabel="Close" onPress={router.back} />
      </Stack.Toolbar>
      {hasFailed && (
        <View className="items-start px-4 pt-2">
          <InlineError>Your recipes are still loading. Try again in a moment</InlineError>
        </View>
      )}
      <CollectionList
        items={scopedRecipes(
          familyTables.filter(({ familyId }) => familyId === planMeals.planFamilyId),
          { kind: "all" },
          search,
        ).map((recipe) => ({
          key: `${recipe.familyId}:${recipe.id}`,
          title: recipe.title,
          photo: recipe.imageKey ? (
            <RecipeCover recipe={{ familyId: recipe.familyId, imageKey: recipe.imageKey }} />
          ) : undefined,
          facts: recipeFacts(recipe),
          onPress: () => {
            if (planMeals.plan(date, recipe.id)) router.back();
            else setHasFailed(true);
          },
        }))}
        emptyState={
          isPending ? (
            <ActivityIndicator className="flex-1" />
          ) : search.trim() === "" ? (
            <EmptyState
              icon="book"
              title="No recipes to plan yet"
              description={
                families.some((family) => !family.personal)
                  ? "Only family recipes can be planned. Share a recipe with your family from its menu."
                  : "Add recipes from the Recipes tab, then plan them here."
              }
            />
          ) : (
            <EmptyState
              icon="magnifyingglass"
              title="No matching recipes"
              description="Try another name or ingredient."
            />
          )
        }
      />
    </>
  );
}
