import { NotFound, Unauthorized } from "@lardon/api";
import { Effect } from "effect";
import { set, withLogger } from "evlog/effect";

import { Authentication } from "./authentication";
import { Families } from "./families";
import { FamilyStores } from "./family-stores";
import { RateLimits, tooManyRequestsResponse } from "./rate-limits";

const syncPath = /^\/sync\/([A-Za-z0-9-]{1,64})$/;

export function syncFamilyId(request: Request) {
  return syncPath.exec(new URL(request.url).pathname)?.[1];
}

function refusal(error: Unauthorized | NotFound, status: number) {
  return Response.json({ _tag: error._tag, message: error.message }, { status });
}

export const syncResponse = Effect.fn("syncResponse")(function* (
  request: Request,
  familyId: string,
) {
  const client = request.headers.get("cf-connecting-ip") ?? "unknown";

  if (!(yield* (yield* RateLimits).allow("api", client))) {
    return tooManyRequestsResponse();
  }

  const user = yield* (yield* Authentication).userFromHeaders(request.headers);

  if (!user) return refusal(new Unauthorized({ message: "Sign in to sync your recipes." }), 401);
  yield* set({ user: { id: user.id }, familyId });

  if (!(yield* (yield* Families).isMember(user.id, familyId))) {
    return refusal(new NotFound({ message: "This family doesn't exist." }), 404);
  }

  return yield* (yield* FamilyStores).connect(familyId, user.id, request);
}, withLogger("sync.connect"));
