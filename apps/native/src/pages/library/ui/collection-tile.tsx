import { Pressable, Text, View } from "react-native";

import { type LibraryRecipe, RecipeThumbnail } from "#/entities/recipe";
import { iconSize, useThemeColors } from "#/shared/lib";
import { Icon, type IconName } from "#/shared/ui";

export function CollectionTile({
  name,
  recipeCount,
  preview,
  icon,
  onPress,
}: {
  name: string;
  recipeCount: number;
  preview: LibraryRecipe | undefined;
  icon: IconName;
  onPress: () => void;
}) {
  const { muted } = useThemeColors("muted");
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
        {preview ? (
          <RecipeThumbnail recipe={preview} width={58} />
        ) : (
          <Icon name={icon} size={iconSize.xl} color={muted} />
        )}
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
