import { Suspense } from "react";
import { View } from "react-native";

import { useThemeColors } from "#/shared/lib";
import { LardonMark, PhotoFrame } from "#/shared/ui";

import { RecipePhoto } from "./recipe-photo";

export function RecipeThumbnail({
  recipe,
  width,
}: {
  recipe: { familyId: string; imageKey?: string };
  width: number;
}) {
  const { white } = useThemeColors("white");
  const borderRadius = Math.round(width * 0.23);

  if (!recipe.imageKey) {
    return (
      <View
        style={{ width, height: width, borderRadius, borderCurve: "continuous" }}
        className="items-center justify-center bg-placeholder"
      >
        <LardonMark width={Math.round(width * 0.5)} color={white} />
      </View>
    );
  }

  return (
    <PhotoFrame style={{ width, height: width, borderRadius }}>
      <Suspense
        fallback={
          <View style={{ borderRadius: borderRadius - 2 }} className="size-full bg-placeholder" />
        }
      >
        <RecipePhoto
          familyId={recipe.familyId}
          imageKey={recipe.imageKey}
          borderRadius={borderRadius - 2}
        />
      </Suspense>
    </PhotoFrame>
  );
}
