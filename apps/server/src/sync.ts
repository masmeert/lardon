import { recipeEvents } from "@lardon/recipes/events";
import { RecipeSyncPayload } from "@lardon/recipes/sync-payload";
import {
  type ForwardedHeaders,
  handleSyncRequest,
  makeDurableObject,
  matchSyncRequest,
} from "@livestore/sync-cf/cf-worker";

import { Effect, Option, Schema } from "effect";

import { Authentication } from "./authentication";
import { Families } from "./families";
import { serverRuntime } from "./layers";

function authorizeRecipeStore(
  headers: ForwardedHeaders | undefined,
  payload: unknown,
  storeId: string,
) {
  return serverRuntime.runPromise(
    Effect.gen(function* () {
      const sessionHeaders = new Headers([...(headers ?? new Map<string, string>())]);
      const decoded = Schema.decodeUnknownOption(RecipeSyncPayload)(payload);
      if (!sessionHeaders.has("cookie") && Option.isSome(decoded)) {
        sessionHeaders.set("cookie", decoded.value.sessionCookie);
      }
      const user = yield* (yield* Authentication).userFromHeaders(sessionHeaders);
      if (!user) return yield* Effect.fail(new Error("Sign in to sync your recipes."));
      if (!(yield* (yield* Families).canAccessRecipeStore(user.id, storeId))) {
        return yield* Effect.fail(new Error("You don't have access to this recipe collection."));
      }
      return user.id;
    }),
  );
}

export class SyncBackendDO extends makeDurableObject({
  storage: { _tag: "do-sqlite" },
  enabledTransports: new Set(["ws"]),
  forwardHeaders: ["cookie"],
  onPush: async (message, { storeId, headers, payload }) => {
    const userId = await authorizeRecipeStore(headers, payload, storeId);
    const forged = message.batch.find(
      (event) =>
        event.name === recipeEvents.recipeCreated.name &&
        (event.args as { createdById?: unknown }).createdById !== userId,
    );
    if (forged) throw new Error("Recipes can only be created on behalf of the signed-in user.");
  },
  onPull: async (_message, { storeId, headers, payload }) => {
    await authorizeRecipeStore(headers, payload, storeId);
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
  const response = await handleSyncRequest({
    request: request as unknown as SyncRequest,
    searchParams,
    ctx: executionContext as unknown as Parameters<typeof handleSyncRequest>[0]["ctx"],
    syncBackendBinding: "SYNC_BACKEND",
    syncPayloadSchema: RecipeSyncPayload,
    validatePayload: async (payload, { storeId, headers }) => {
      await authorizeRecipeStore(headers, payload, storeId);
    },
  });
  return response as unknown as Response;
}
