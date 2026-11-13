import type { Stored } from "@lardon/recipes";
import { Text, View } from "react-native";

import { iconSize, useThemeColors } from "#/shared/lib";
import { Icon } from "#/shared/ui";

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;

  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export function RecipeFacts({ recipe }: { recipe: Stored<"recipes"> }) {
  const { muted } = useThemeColors("muted");
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);

  if (recipe.servings === undefined && totalMinutes === 0) return null;

  return (
    <View className="flex-row flex-wrap items-center gap-3">
      {recipe.servings !== undefined && (
        <View className="flex-row items-center gap-1">
          <Icon name="person.2" size={iconSize.sm} color={muted} />
          <Text className="text-caption text-muted">{recipe.servings}</Text>
        </View>
      )}
      {totalMinutes > 0 && (
        <View className="flex-row items-center gap-1">
          <Icon name="clock" size={iconSize.sm} color={muted} />
          <Text className="text-caption text-muted">{formatMinutes(totalMinutes)}</Text>
        </View>
      )}
    </View>
  );
}
