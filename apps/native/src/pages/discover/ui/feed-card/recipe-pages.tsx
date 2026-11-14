import type { FeedRecipe } from "@lardon/api";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";

import { FeedCover } from "#/entities/recipe";
import { SaveButton, type useSaveRecipe } from "#/features/save-recipe";
import { useThemeColors } from "#/shared/lib";
import { LardonMark, PhotoFrame } from "#/shared/ui";

import { IngredientsPage } from "./ingredients-page";

export function RecipePages({
  published,
  saving,
  onOpen,
}: {
  published: FeedRecipe;
  saving: ReturnType<typeof useSaveRecipe>;
  onOpen: () => void;
}) {
  const { white } = useThemeColors("white");
  const { width } = useWindowDimensions();
  const { imageKey, recipeId, recipe } = published;
  const hasIngredients = recipe.ingredients.length > 0;
  const pageWidth = width - (hasIngredients ? 56 : 32);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={pageWidth + 8}
      decelerationRate="fast"
      scrollEnabled={hasIngredients}
      contentContainerClassName="gap-2 px-4"
    >
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${recipe.title}`}
          onPress={onOpen}
          className="active:opacity-90"
        >
          <PhotoFrame
            style={{ width: pageWidth, height: pageWidth }}
            className="rounded-[24px] p-1"
          >
            <View
              style={{ borderCurve: "continuous" }}
              className="flex-1 items-center justify-center overflow-hidden rounded-[20px] bg-placeholder"
            >
              {imageKey ? (
                <FeedCover recipeId={recipeId} imageKey={imageKey} />
              ) : (
                <LardonMark width={120} color={white} />
              )}
            </View>
          </PhotoFrame>
        </Pressable>
        <View className="absolute top-3 right-3">
          <SaveButton saving={saving} />
        </View>
      </View>
      {hasIngredients && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ingredients for ${recipe.title}`}
          onPress={onOpen}
          className="active:opacity-90"
        >
          <IngredientsPage published={published} sizePt={pageWidth} />
        </Pressable>
      )}
    </ScrollView>
  );
}
