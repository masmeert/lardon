import { verification } from "@lardon/db/schema/auth";
import { familyMember } from "@lardon/db/schema/families";
import { eq } from "@lardon/db/orm";
import { personalStoreId } from "@lardon/recipes/store-id";
import { Context, Effect, Layer } from "effect";

import { Database } from "./database";
import { Families } from "./families";
import { ImageStorage } from "./image-storage";
import { RecipeStoreBackend } from "./recipe-store-backend";

export class Accounts extends Context.Service<
  Accounts,
  { wipe(userId: string): Effect.Effect<void> }
>()("lardon/server/Accounts") {
  static readonly layer = Layer.effect(
    Accounts,
    Effect.gen(function* () {
      const database = yield* Database;
      const families = yield* Families;
      const recipeStores = yield* RecipeStoreBackend;
      const images = yield* ImageStorage;

      return Accounts.of({
        wipe: Effect.fn("Accounts.wipe")(function* (userId: string) {
          const memberships = yield* database.use((client) =>
            client
              .select({ familyId: familyMember.familyId })
              .from(familyMember)
              .where(eq(familyMember.userId, userId)),
          );
          yield* Effect.forEach(memberships, ({ familyId }) =>
            families.leave(userId, familyId).pipe(Effect.catchTag("NotFound", () => Effect.void)),
          );
          yield* database.use((client) =>
            client.delete(verification).where(eq(verification.value, userId)),
          );
          yield* recipeStores.deleteStore(personalStoreId(userId));
          yield* images.deleteAll(`${personalStoreId(userId)}/`);
        }),
      });
    }),
  );
}
