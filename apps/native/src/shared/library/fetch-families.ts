import { FamilySummary } from "@lardon/api/families";
import { Schema } from "effect";

import { authClient } from "#/shared/auth";
import { ENV } from "#/shared/config";

export async function fetchFamilies() {
  const response = await fetch(`${ENV.EXPO_PUBLIC_SERVER_URL}/api/families`, {
    headers: { cookie: await authClient.getCookie() },
  });

  if (!response.ok) {
    throw new Error(`Listing families failed with status ${response.status}`);
  }

  return Schema.decodeUnknownSync(Schema.Array(FamilySummary))(await response.json());
}
