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
import { serverRuntime } from "./layers";
import { RateLimits, tooManyRequests } from "./rate-limits";

function authorizeRecipeStore(
  phase: "connect" | "push" | "pull",
  headers: ForwardedHeaders | undefined,
  payload: Schema.Json | undefined,
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

  const logged = withLogger(`sync.${phase}`, { fields: { storeId } });

  return serverRuntime.runPromise(
    phase === "connect"
      ? authorization.pipe(logged)
      : authorization.pipe(
          Effect.tapError((error) => Effect.ignore(Effect.fail(error).pipe(logged))),
        ),
  );
}

export class SyncBackendDO extends makeDurableObject({
  // oxlint-disable-next-line anti-slop-effect/no-manual-tagged-construction -- livestore's storage option is a plain tagged literal with no constructor
  storage: { _tag: "do-sqlite" },
  enabledTransports: new Set(["ws"]),
  forwardHeaders: ["cookie"],
  onPush: async (message, { storeId, headers, payload }) => {
    const userId = await authorizeRecipeStore("push", headers, payload, storeId);

    const forged = message.batch.find(
      (event) =>
        event.name === recipeEvents.recipeCreated.name &&
        !Option.exists(
          Schema.decodeUnknownOption(Schema.Struct({ createdById: Schema.String }))(event.args),
          (args) => args.createdById === userId,
        ),
    );

    if (forged) {
      const rejection = new Forbidden({
        message: "Recipes can only be created on behalf of the signed-in user.",
      });

      await serverRuntime.runPromise(
        Effect.ignore(
          Effect.fail(rejection).pipe(
            withLogger("sync.push", {
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
  declare readonly ctx: DurableObjectState;

  async deleteStore() {
    for (const socket of this.ctx.getWebSockets()) {
      socket.close(4404, "This recipe collection was deleted.");
    }

    await this.ctx.storage.deleteAll();
  }
}

export function matchRecipeSyncRequest(request: Request) {
  return new URL(request.url).pathname === "/sync" ? matchSyncRequest(request) : undefined;
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

  return handleSyncRequest({
    request,
    searchParams,
    ctx: executionContext,
    syncBackendBinding: "SYNC_BACKEND",
    syncPayloadSchema: RecipeSyncPayload,
    validatePayload: async (payload, { storeId, headers }) => {
      await authorizeRecipeStore("connect", headers, payload, storeId);
    },
  });
}
