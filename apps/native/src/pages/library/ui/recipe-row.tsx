import type { Stored } from "@lardon/recipes";
import { Text, View } from "react-native";

import type { LibraryFamily } from "#/shared/library";
import { cn, iconSize, useThemeColors } from "#/shared/lib";
import { Icon } from "#/shared/ui";

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;

  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

function recipeDetails(recipe: Stored<"recipes">, family: LibraryFamily, isFamilyShown: boolean) {
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);

  return [
    recipe.servings === undefined ? undefined : `Serves ${recipe.servings}`,
    totalMinutes > 0 ? formatMinutes(totalMinutes) : undefined,
    isFamilyShown && !family.personal ? family.name : undefined,
  ]
    .filter((detail) => detail !== undefined)
    .join(", ");
}

export function RecipeRow({
  recipe,
  family,
  isFamilyShown,
  isFirst,
  isLast,
}: {
  recipe: Stored<"recipes">;
  family: LibraryFamily;
  isFamilyShown: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { accent } = useThemeColors("accent");
  const details = recipeDetails(recipe, family, isFamilyShown);

  return (
    <View
      style={{ borderCurve: "continuous" }}
      className={cn(
        "mx-4 flex-row items-center gap-3 bg-paper px-4 py-2.5",
        isFirst && "rounded-t-card",
        isLast && "rounded-b-card",
      )}
    >
      <View
        style={{ borderCurve: "continuous" }}
        className="size-11 items-center justify-center rounded-inner bg-placeholder"
      >
        <Icon name="fork.knife" size={iconSize.md} color={accent} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-title text-foreground">
          {recipe.title}
        </Text>
        {details !== "" && (
          <Text numberOfLines={1} className="text-caption text-muted">
            {details}
          </Text>
        )}
      </View>
    </View>
  );
}
