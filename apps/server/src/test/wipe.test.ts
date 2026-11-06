import { familyStoreId, personalStoreId } from "@lardon/recipes/store-id";
import { Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { verification } from "@lardon/db/schema/auth";

import { Accounts } from "../accounts";
import { Database } from "../database";
import { DeletedStores, StoredImages, createUser, runTest } from "./environment";

const TINY_PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  ),
  (character) => character.charCodeAt(0),
);

describe("pictures across stores", () => {
  it("copies a picture into another store the user can access", () =>
    runTest(
      Effect.gen(function* () {
        const images = yield* StoredImages;
        const alice = yield* createUser("Alice");
        const mallory = yield* createUser("Mallory");
        const family = yield* alice.api.families.create({ payload: { name: "Meerts" } });
        const { imageKey } = yield* alice.api.images.upload({
          params: { storeId: personalStoreId(alice.id) },
          payload: TINY_PNG,
        });

        const copied = yield* alice.api.images.copy({
          params: { storeId: familyStoreId(family.id) },
          payload: { imageKey },
        });
        expect(copied.imageKey.startsWith(`${familyStoreId(family.id)}/`)).toBe(true);
        expect(images.get(copied.imageKey)?.bytes).toEqual(images.get(imageKey)?.bytes);

        const stolen = yield* mallory.api.images
          .copy({ params: { storeId: personalStoreId(mallory.id) }, payload: { imageKey } })
          .pipe(Effect.flip);
        expect(stolen._tag).toBe("NotFound");
      }),
    ));
});

describe("account wipe", () => {
  it("removes the user's data everywhere while keeping shared families alive", () =>
    runTest(
      Effect.gen(function* () {
        const images = yield* StoredImages;
        const deletedStores = yield* DeletedStores;
        const accounts = yield* Accounts;
        const alice = yield* createUser("Alice");
        const bob = yield* createUser("Bob");

        const shared = yield* alice.api.families.create({ payload: { name: "Shared" } });
        const invite = yield* alice.api.families.createInvite({ params: { familyId: shared.id } });
        yield* bob.api.families.join({ payload: { code: invite.code } });
        const solo = yield* alice.api.families.create({ payload: { name: "Solo" } });

        const upload = (storeId: string) =>
          alice.api.images.upload({ params: { storeId }, payload: TINY_PNG });
        const personalPicture = yield* upload(personalStoreId(alice.id));
        const soloPicture = yield* upload(familyStoreId(solo.id));
        const sharedPicture = yield* upload(familyStoreId(shared.id));

        const database = yield* Database;
        const pendingTokens = [
          { id: "alice-reset", identifier: "reset-password:alice", value: alice.id },
          { id: "bob-reset", identifier: "reset-password:bob", value: bob.id },
        ];
        yield* database.use((client) =>
          client.insert(verification).values(
            pendingTokens.map((token) => ({
              ...token,
              expiresAt: new Date(Date.now() + 3_600_000),
            })),
          ),
        );

        yield* accounts.wipe(alice.id);

        const remainingTokens = yield* database.use((client) =>
          client.select({ id: verification.id }).from(verification),
        );
        expect(remainingTokens).toEqual([{ id: "bob-reset" }]);

        expect(deletedStores.sort()).toEqual(
          [familyStoreId(solo.id), personalStoreId(alice.id)].sort(),
        );
        expect(images.has(personalPicture.imageKey)).toBe(false);
        expect(images.has(soloPicture.imageKey)).toBe(false);
        expect(images.has(sharedPicture.imageKey)).toBe(true);

        const remaining = yield* bob.api.families.get({ params: { familyId: shared.id } });
        expect(remaining.role).toBe("owner");
        expect(remaining.members.map((member) => member.name)).toEqual(["Bob"]);
        expect(yield* alice.api.families.list()).toEqual([]);

        yield* accounts.wipe(alice.id);
      }),
    ));
});
