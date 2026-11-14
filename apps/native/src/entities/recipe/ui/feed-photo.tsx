import { Image } from "expo-image";
import { use } from "react";
import { withUniwind } from "uniwind";

import { SessionCookieContext } from "#/shared/auth";
import { ENV } from "#/shared/config";

const StyledImage = withUniwind(Image);

export function FeedPhoto({ recipeId, imageKey }: { recipeId: string; imageKey: string }) {
  const cookie = use(use(SessionCookieContext));

  return (
    <StyledImage
      source={{
        uri: `${ENV.EXPO_PUBLIC_SERVER_URL}/api/feed/${recipeId}/images/${imageKey}`,
        headers: { cookie },
        cacheKey: `feed-${recipeId}-${imageKey}`,
      }}
      recyclingKey={`${recipeId}-${imageKey}`}
      contentFit="cover"
      transition={150}
      className="size-full bg-placeholder"
    />
  );
}
