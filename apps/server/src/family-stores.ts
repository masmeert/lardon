import { Context, Effect } from "effect";

import type { FamilyStore } from "./family-store";

export const USER_HEADER = "x-lardon-user";

export class FamilyStores extends Context.Service<
  FamilyStores,
  {
    connect(familyId: string, userId: string, request: Request): Effect.Effect<Response>;
    disconnect(familyId: string, userId: string): Effect.Effect<void>;
    delete(familyId: string): Effect.Effect<void>;
  }
>()("lardon/server/FamilyStores") {
  static fromDurableObjects(namespace: DurableObjectNamespace<FamilyStore>) {
    return FamilyStores.of({
      connect: (familyId, userId, request) =>
        Effect.promise(() => {
          const headers = new Headers(request.headers);
          headers.set(USER_HEADER, userId);

          return namespace
            .getByName(familyId)
            .fetch(new Request(`https://family-store/${familyId}`, { headers }));
        }),
      disconnect: (familyId, userId) =>
        Effect.promise(() => namespace.getByName(familyId).disconnect(userId)),
      delete: (familyId) => Effect.promise(() => namespace.getByName(familyId).destroy()),
    });
  }
}

export function inEuropeanUnion<StoreObject extends Rpc.DurableObjectBranded | undefined>(
  namespace: DurableObjectNamespace<StoreObject>,
) {
  try {
    return namespace.jurisdiction("eu");
  } catch (error) {
    if (String(error).includes("Jurisdiction restrictions are not implemented")) return namespace;

    throw error;
  }
}
