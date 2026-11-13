import { FamilySummary } from "@lardon/api/families";
import { queryOptions } from "@tanstack/react-query";
import { Schema } from "effect";

import { authClient } from "#/shared/auth";
import { ENV } from "#/shared/config";

const Families = Schema.Array(FamilySummary);

export const familiesQuery = queryOptions({
  queryKey: ["families"],
  queryFn: async () => {
    const response = await fetch(`${ENV.EXPO_PUBLIC_SERVER_URL}/api/families`, {
      headers: { cookie: await authClient.getCookie() },
    });

    if (!response.ok) throw new Error(`Listing families failed with status ${response.status}`);

    return Schema.decodeUnknownSync(Schema.toEncoded(Families))(await response.json());
  },
  select: Schema.decodeSync(Families),
});
