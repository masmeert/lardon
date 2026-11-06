import { makeAdapter } from "@livestore/adapter-node";
import { createStorePromise, nanoid } from "@livestore/livestore";

import { recipeSchema } from "../schema";

export function createTestStore() {
  return createStorePromise({
    schema: recipeSchema,
    adapter: makeAdapter({ storage: { type: "in-memory" } }),
    storeId: `test-${nanoid()}`,
    batchUpdates: (update) => update(),
    disableDevtools: true,
  });
}
