import { use } from "react";
import { Image } from "react-native";

import { SessionCookieContext } from "#/shared/auth";
import { ENV } from "#/shared/config";

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
    <Image
      source={{
        uri: `${ENV.EXPO_PUBLIC_SERVER_URL}/api/families/${familyId}/images/${imageKey}`,
        headers: { cookie },
      }}
      resizeMode="cover"
      style={{ borderRadius }}
      className="size-full bg-placeholder"
    />
  );
}
