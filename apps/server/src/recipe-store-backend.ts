import { Context, Effect } from "effect";

interface RecipeStoreObject extends Rpc.DurableObjectBranded {
  deleteStore(): Promise<void>;
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
