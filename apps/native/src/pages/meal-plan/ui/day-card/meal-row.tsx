import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type LibraryMeal, RecipeThumbnail } from "#/entities/recipe";
import { iconSize, useThemeColors } from "#/shared/lib";
import { Icon } from "#/shared/ui";

export function MealRow({ meal, isFirst }: { meal: LibraryMeal; isFirst: boolean }) {
  const { muted } = useThemeColors("muted");

  return (
    <View>
      {!isFirst && (
        <View style={{ height: StyleSheet.hairlineWidth }} className="ml-[76px] bg-hairline" />
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          router.push({ pathname: "/recipe/[recipeId]", params: { recipeId: meal.recipe.id } })
        }
        className="flex-row items-center gap-3 py-2.5 pr-4 pl-4 active:opacity-70"
      >
        <RecipeThumbnail
          recipe={{ familyId: meal.familyId, imageKey: meal.recipe.imageKey }}
          width={48}
        />
        <Text numberOfLines={2} className="flex-1 text-title text-foreground">
          {meal.recipe.title}
        </Text>
        <Icon name="chevron.right" size={iconSize.sm} color={muted} />
      </Pressable>
    </View>
  );
}
