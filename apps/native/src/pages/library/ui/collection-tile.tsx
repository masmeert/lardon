import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export function CollectionTile({
  name,
  recipeCount,
  cover,
  onPress,
}: {
  name: string;
  recipeCount: number;
  cover: ReactNode;
  onPress: () => void;
}) {
  const recipeCountLabel = recipeCount === 1 ? "1 recipe" : `${recipeCount} recipes`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${recipeCountLabel}`}
      onPress={onPress}
      className="w-24 gap-2 active:opacity-70"
    >
      <View
        style={{ borderCurve: "continuous" }}
        className="size-24 items-center justify-center rounded-card bg-paper"
      >
        {cover}
      </View>
      <View className="px-1">
        <Text numberOfLines={1} className="text-caption font-semibold text-foreground">
          {name}
        </Text>
        <Text numberOfLines={1} className="text-label text-muted">
          {recipeCountLabel}
        </Text>
      </View>
    </Pressable>
  );
}
