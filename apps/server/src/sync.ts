import { recipeEvents } from "@lardon/recipes/events";
import { RecipeSyncPayload } from "@lardon/recipes/sync-payload";
import {
  type ForwardedHeaders,
  handleSyncRequest,
  makeDurableObject,
  matchSyncRequest,
} from "@livestore/sync-cf/cf-worker";

import { Forbidden, NotFound, Unauthorized } from "@lardon/api";
import { Effect, Option, Schema } from "effect";
import { set, withLogger } from "evlog/effect";

import { Authentication } from "./authentication";
import { Families } from "./families";
import { axiomDrain, serverRuntime } from "./layers";
import { RateLimits, tooManyRequests } from "./rate-limits";

function authorizeRecipeStore(
  phase: "connect" | "push" | "pull",
  headers: ForwardedHeaders | undefined,
  payload: unknown,
  storeId: string,
) {
  const authorization = Effect.gen(function* () {
    const sessionHeaders = new Headers([...(headers ?? new Map<string, string>())]);
    const decoded = Schema.decodeUnknownOption(RecipeSyncPayload)(payload);
    if (!sessionHeaders.has("cookie") && Option.isSome(decoded)) {
      sessionHeaders.set("cookie", decoded.value.sessionCookie);
    }
    const user = yield* (yield* Authentication).userFromHeaders(sessionHeaders);
    if (!user) return yield* new Unauthorized({ message: "Sign in to sync your recipes." });
    yield* set({ user: { id: user.id } });
    if (!(yield* (yield* Families).canAccessRecipeStore(user.id, storeId))) {
      return yield* new NotFound({ message: "You don't have access to this recipe collection." });
    }
    return user.id;
  });
  const logged = withLogger(`sync.${phase}`, { drain: axiomDrain, fields: { storeId } });
  return serverRuntime.runPromise(
    phase === "connect"
      ? authorization.pipe(logged)
      : authorization.pipe(
          Effect.tapError((error) => Effect.ignore(Effect.fail(error).pipe(logged))),
        ),
  );
}

export class SyncBackendDO extends makeDurableObject({
  storage: { _tag: "do-sqlite" },
  enabledTransports: new Set(["ws"]),
  forwardHeaders: ["cookie"],
  onPush: async (message, { storeId, headers, payload }) => {
    const userId = await authorizeRecipeStore("push", headers, payload, storeId);
    const forged = message.batch.find(
      (event) =>
        event.name === recipeEvents.recipeCreated.name &&
        (event.args as { createdById?: unknown }).createdById !== userId,
    );
    if (forged) {
      const rejection = new Forbidden({
        message: "Recipes can only be created on behalf of the signed-in user.",
      });
      await serverRuntime.runPromise(
        Effect.ignore(
          Effect.fail(rejection).pipe(
            withLogger("sync.push", {
              drain: axiomDrain,
              fields: { storeId, user: { id: userId } },
            }),
          ),
        ),
      );
      throw rejection;
    }
  },
  onPull: async (_message, { storeId, headers, payload }) => {
    await authorizeRecipeStore("pull", headers, payload, storeId);
  },
}) {
  async deleteStore() {
    const { ctx } = this as unknown as { ctx: DurableObjectState };
    for (const socket of ctx.getWebSockets()) {
      socket.close(4404, "This recipe collection was deleted.");
    }
    await ctx.storage.deleteAll();
  }
}

type SyncRequest = Parameters<typeof matchSyncRequest>[0];

export function matchRecipeSyncRequest(request: Request) {
  return new URL(request.url).pathname === "/sync"
    ? matchSyncRequest(request as unknown as SyncRequest)
    : undefined;
}

export async function handleRecipeSyncRequest(
  request: Request,
  searchParams: NonNullable<ReturnType<typeof matchSyncRequest>>,
  executionContext: ExecutionContext,
) {
  const allowed = await serverRuntime.runPromise(
    Effect.gen(function* () {
      return yield* (yield* RateLimits).allow(
        "api",
        request.headers.get("cf-connecting-ip") ?? "unknown",
      );
    }),
  );
  if (!allowed) {
    return Response.json(
      { _tag: tooManyRequests._tag, message: tooManyRequests.message },
      { status: 429, headers: { "retry-after": "60" } },
    );
  }
  const response = await handleSyncRequest({
    request: request as unknown as SyncRequest,
    searchParams,
    ctx: executionContext as unknown as Parameters<typeof handleSyncRequest>[0]["ctx"],
    syncBackendBinding: "SYNC_BACKEND",
    syncPayloadSchema: RecipeSyncPayload,
    validatePayload: async (payload, { storeId, headers }) => {
      await authorizeRecipeStore("connect", headers, payload, storeId);
    },
  });
  return response as unknown as Response;
}
