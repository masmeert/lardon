import { familyStoreId, personalStoreId } from "@lardon/recipes/store-id";
import { Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { Families } from "../families";
import { StoredImages, clientFor, createUser, runTest } from "./environment";

const TINY_PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  ),
  (character) => character.charCodeAt(0),
);

describe("account", () => {
  it("returns the signed-in user and rejects anonymous requests", () =>
    runTest(
      Effect.gen(function* () {
        const alice = yield* createUser("Alice");
        expect(yield* alice.api.account.me()).toMatchObject({ id: alice.id, name: "Alice" });

        const anonymous = yield* clientFor(null);
        yield* anonymous.health();
        const error = yield* anonymous.families.list().pipe(Effect.flip);
        expect(error).toMatchObject({ _tag: "Unauthorized", message: "Sign in to continue." });
      }),
    ));
});

describe("recipe store access", () => {
  it("allows users into their own store and their families' stores only", () =>
    runTest(
      Effect.gen(function* () {
        const families = yield* Families;
        const alice = yield* createUser("Alice");
        const bob = yield* createUser("Bob");
        const family = yield* alice.api.families.create({ payload: { name: "Meerts" } });
        const canAccess = (userId: string, storeId: string) =>
          families.canAccessRecipeStore(userId, storeId);

        expect(yield* canAccess(alice.id, personalStoreId(alice.id))).toBe(true);
        expect(yield* canAccess(alice.id, familyStoreId(family.id))).toBe(true);
        expect(yield* canAccess(bob.id, personalStoreId(alice.id))).toBe(false);
        expect(yield* canAccess(bob.id, familyStoreId(family.id))).toBe(false);
        expect(yield* canAccess(alice.id, "something-else")).toBe(false);

        const invite = yield* alice.api.families.createInvite({ params: { familyId: family.id } });
        yield* bob.api.families.join({ payload: { code: invite.code } });
        expect(yield* canAccess(bob.id, familyStoreId(family.id))).toBe(true);

        yield* alice.api.families.removeMember({ params: { familyId: family.id, userId: bob.id } });
        expect(yield* canAccess(bob.id, familyStoreId(family.id))).toBe(false);
      }).pipe(Effect.provide(Families.layer)),
    ));
});

describe("images", () => {
  it("stores pictures for accessible stores and serves them publicly", () =>
    runTest(
      Effect.gen(function* () {
        const images = yield* StoredImages;
        const alice = yield* createUser("Alice");
        const bob = yield* createUser("Bob");

        const { imageKey } = yield* alice.api.images.upload({
          params: { storeId: personalStoreId(alice.id) },
          payload: TINY_PNG,
        });
        expect(imageKey).toMatch(/^[0-9a-f-]{36}\.png$/);
        expect(images.get(imageKey)?.contentType).toBe("image/png");

        const anonymous = yield* clientFor(null);
        const downloaded = yield* anonymous.imageFiles.download({ params: { imageKey } });
        expect([...downloaded]).toEqual([...TINY_PNG]);

        const foreign = yield* bob.api.images
          .upload({ params: { storeId: personalStoreId(alice.id) }, payload: TINY_PNG })
          .pipe(Effect.flip);
        expect(foreign._tag).toBe("NotFound");

        const notAnImage = yield* alice.api.images
          .upload({
            params: { storeId: personalStoreId(alice.id) },
            payload: new TextEncoder().encode("nope"),
          })
          .pipe(Effect.flip);
        expect(notAnImage).toMatchObject({
          _tag: "InvalidRequest",
          message: "The image must be a JPEG, PNG or WebP file.",
        });
        expect(images.size).toBe(1);
      }),
    ));
});
