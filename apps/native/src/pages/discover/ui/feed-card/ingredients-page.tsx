import type { FeedRecipe } from "@lardon/api";
import { formatAmount } from "@lardon/recipes";
import { Text, View } from "react-native";

import { FeedCover } from "#/entities/recipe";
import { useThemeColors } from "#/shared/lib";
import { Glass } from "#/shared/ui";

export function IngredientsPage({ published, sizePt }: { published: FeedRecipe; sizePt: number }) {
  const { accent } = useThemeColors("accent");
  const { recipe, recipeId, imageKey } = published;
  const shown = recipe.ingredients.slice(0, 7);
  const hiddenCount = recipe.ingredients.length - shown.length;

  return (
    <View
      style={{ width: sizePt, height: sizePt, borderCurve: "continuous" }}
      className="overflow-hidden rounded-[24px] bg-accent"
    >
      {imageKey && (
        <View className="absolute inset-0 scale-125">
          <FeedCover recipeId={recipeId} imageKey={imageKey} />
        </View>
      )}
      <Glass
        tintColor={`${accent}b3`}
        style={{ borderCurve: "continuous" }}
        className="absolute inset-0 rounded-[24px]"
      />
      <View className="flex-1 gap-4 p-5">
        <Text className="text-title font-semibold text-white">
          {`${recipe.ingredients.length} ${recipe.ingredients.length === 1 ? "ingredient" : "ingredients"}`}
        </Text>
        <View
          style={{ borderCurve: "continuous" }}
          className="gap-2.5 rounded-card border border-white/30 bg-white/10 px-4 py-3.5"
        >
          {shown.map((ingredient, index) => (
            <View key={`${index}-${ingredient.name}`} className="flex-row items-baseline gap-3">
              <Text numberOfLines={1} className="flex-1 text-body text-white">
                {ingredient.name}
              </Text>
              <Text className="text-body font-semibold text-white">
                {formatAmount(ingredient, 1, "original")}
              </Text>
            </View>
          ))}
          {hiddenCount > 0 && (
            <Text className="text-caption text-white/70">{`and ${hiddenCount} more`}</Text>
          )}
        </View>
      </View>
    </View>
  );
}
