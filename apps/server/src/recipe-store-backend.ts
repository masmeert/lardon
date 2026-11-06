import { Context, Effect } from "effect";

export class RecipeStoreBackend extends Context.Service<
  RecipeStoreBackend,
  {
    deleteStore(storeId: string): Effect.Effect<void>;
  }
>()("lardon/server/RecipeStoreBackend") {
  static fromDurableObjects(namespace: DurableObjectNamespace) {
    return RecipeStoreBackend.of({
      deleteStore: (storeId) =>
        Effect.promise(() =>
          (
            namespace.getByName(storeId) as unknown as { deleteStore(): Promise<void> }
          ).deleteStore(),
        ),
    });
  }
}
