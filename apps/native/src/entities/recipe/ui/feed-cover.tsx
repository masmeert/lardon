import { Suspense } from "react";
import { View } from "react-native";

import { FeedPhoto } from "./feed-photo";

export function FeedCover({ recipeId, imageKey }: { recipeId: string; imageKey: string }) {
  return (
    <Suspense fallback={<View className="size-full bg-placeholder" />}>
      <FeedPhoto recipeId={recipeId} imageKey={imageKey} />
    </Suspense>
  );
}
