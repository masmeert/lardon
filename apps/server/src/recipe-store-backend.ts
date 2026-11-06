import { Context, Effect } from "effect";

interface RecipeStoreObject extends Rpc.DurableObjectBranded {
  deleteStore(): Promise<void>;
}

// Cloudflare only sets Durable Object jurisdiction in code; local workerd throws on it, so dev falls back to the unrestricted namespace.
export function inEuropeanUnion<StoreObject extends Rpc.DurableObjectBranded | undefined>(
  namespace: DurableObjectNamespace<StoreObject>,
) {
  try {
    return namespace.jurisdiction("eu");
  } catch (error) {
    if (String(error).includes("Jurisdiction restrictions are not implemented")) {
      return namespace;
    }

    throw error;
  }
}

export class RecipeStoreBackend extends Context.Service<
  RecipeStoreBackend,
  {
    deleteStore(storeId: string): Effect.Effect<void>;
  }
>()("lardon/server/RecipeStoreBackend") {
  static fromDurableObjects(namespace: DurableObjectNamespace<RecipeStoreObject>) {
    return RecipeStoreBackend.of({
      deleteStore: (storeId) => Effect.promise(() => namespace.getByName(storeId).deleteStore()),
    });
  }
}
