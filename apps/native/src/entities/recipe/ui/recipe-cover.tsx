import { Suspense } from "react";
import { View } from "react-native";

import { useThemeColors } from "#/shared/lib";
import { Icon, type IconName, LardonMark } from "#/shared/ui";

import { RecipePhoto } from "./recipe-photo";

export function RecipeCover({
  recipe,
  sizePt,
  placeholderIcon,
}: {
  recipe?: { familyId: string; imageKey?: string };
  sizePt: number;
  placeholderIcon?: IconName;
}) {
  const { placeholder } = useThemeColors("placeholder");

  if (!recipe?.imageKey) {
    return (
      <View className="size-full items-center justify-center bg-accent">
        {placeholderIcon ? (
          <Icon name={placeholderIcon} size={Math.round(sizePt * 0.3)} color={placeholder} />
        ) : (
          <LardonMark width={Math.round(sizePt * 0.45)} color={placeholder} />
        )}
      </View>
    );
  }

  return (
    <Suspense fallback={<View className="size-full bg-placeholder" />}>
      <RecipePhoto familyId={recipe.familyId} imageKey={recipe.imageKey} borderRadius={0} />
    </Suspense>
  );
}
