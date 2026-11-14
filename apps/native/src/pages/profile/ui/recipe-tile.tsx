import type { FeedRecipe } from "@lardon/api";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { FeedCover } from "#/entities/recipe";
import { useThemeColors } from "#/shared/lib";
import { LardonMark, PhotoFrame } from "#/shared/ui";

export function RecipeTile({ published, sizePt }: { published: FeedRecipe; sizePt: number }) {
  const { white } = useThemeColors("white");
  const { recipeId, imageKey, recipe } = published;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
      onPress={() => router.push({ pathname: "/feed/[recipeId]", params: { recipeId } })}
      className="active:opacity-80"
    >
      <PhotoFrame style={{ width: sizePt, height: sizePt, borderRadius: 16 }}>
        <View
          style={{ borderRadius: 14, borderCurve: "continuous" }}
          className="flex-1 overflow-hidden bg-placeholder"
        >
          {imageKey ? (
            <FeedCover recipeId={recipeId} imageKey={imageKey} />
          ) : (
            <View className="flex-1 items-center justify-center">
              <LardonMark width={Math.round(sizePt * 0.42)} color={white} />
            </View>
          )}
        </View>
      </PhotoFrame>
    </Pressable>
  );
}
