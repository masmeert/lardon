import { Unauthorized } from "@lardon/api";
import { Effect } from "effect";
import { set, withLogger } from "evlog/effect";

import { Authentication } from "./authentication";
import { errorResponse } from "./error-response";
import { Families, missingFamily } from "./families";
import { FamilyStores } from "./family-stores";
import { RateLimits, clientKey, tooManyRequestsResponse } from "./rate-limits";

export function syncFamilyId(request: Request) {
  return /^\/sync\/([A-Za-z0-9-]{1,64})$/.exec(new URL(request.url).pathname)?.[1];
}

export const syncResponse = Effect.fn("syncResponse")(function* (
  request: Request,
  familyId: string,
) {
  if (!(yield* (yield* RateLimits).allow("api", clientKey(request.headers)))) {
    return tooManyRequestsResponse();
  }

  const user = yield* (yield* Authentication).userFromHeaders(request.headers);

  if (!user) {
    return errorResponse(new Unauthorized({ message: "Sign in to sync your recipes." }), 401);
  }

  yield* set({ user: { id: user.id }, familyId });

  if (!(yield* (yield* Families).isMember(user.id, familyId))) {
    return errorResponse(missingFamily, 404);
  }

  return yield* (yield* FamilyStores).connect(familyId, user.id, request);
}, withLogger("sync.connect"));
