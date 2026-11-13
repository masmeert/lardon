import { Image } from "expo-image";
import { use } from "react";
import { withUniwind } from "uniwind";

import { SessionCookieContext } from "#/shared/auth";
import { ENV } from "#/shared/config";

const StyledImage = withUniwind(Image);

export function RecipePhoto({
  familyId,
  imageKey,
  borderRadius,
}: {
  familyId: string;
  imageKey: string;
  borderRadius: number;
}) {
  const cookie = use(use(SessionCookieContext));

  return (
    <StyledImage
      source={{
        uri: `${ENV.EXPO_PUBLIC_SERVER_URL}/api/families/${familyId}/images/${imageKey}`,
        headers: { cookie },
        cacheKey: imageKey,
      }}
      recyclingKey={imageKey}
      contentFit="cover"
      transition={150}
      style={{ borderRadius }}
      className="size-full bg-placeholder"
    />
  );
}
