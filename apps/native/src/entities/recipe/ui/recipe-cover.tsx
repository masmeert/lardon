import { Suspense } from "react";
import { View } from "react-native";

import { RecipePhoto } from "./recipe-photo";

export function RecipeCover({ recipe }: { recipe: { familyId: string; imageKey: string } }) {
  return (
    <Suspense fallback={<View className="size-full bg-placeholder" />}>
      <RecipePhoto familyId={recipe.familyId} imageKey={recipe.imageKey} borderRadius={0} />
    </Suspense>
  );
}
