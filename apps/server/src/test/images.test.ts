import { Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { unreferencedImageKeys } from "../image-storage";
import { FamilyStoreCalls, StoredImages, createUser, runTest } from "./environment";

const TINY_PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  ),
  (character) => character.charCodeAt(0),
);

describe("pictures", () => {
  it("stores pictures per family and serves them to members only", () =>
    runTest(
      Effect.gen(function* () {
        const images = yield* StoredImages;
        const alice = yield* createUser("Alice");
        const mallory = yield* createUser("Mallory");
        const family = yield* alice.api.families.create({ payload: { name: "Meerts" } });
        const params = { familyId: family.id };

        const { imageKey } = yield* alice.api.images.upload({ params, payload: TINY_PNG });

        expect(imageKey).toMatch(/^[0-9a-f-]{36}\.png$/);
        expect(images.get(`families/${family.id}/${imageKey}`)?.contentType).toBe("image/png");

        const downloaded = yield* alice.api.images.download({ params: { ...params, imageKey } });
        expect([...downloaded]).toEqual([...TINY_PNG]);

        const refusals = yield* Effect.all([
          mallory.api.images.download({ params: { ...params, imageKey } }).pipe(Effect.flip),
          mallory.api.images.upload({ params, payload: TINY_PNG }).pipe(Effect.flip),
          alice.api.images.upload({ params, payload: new Uint8Array([1, 2, 3]) }).pipe(Effect.flip),
        ]);

        expect(refusals.map((error) => [error._tag, error.message])).toEqual([
          ["NotFound", "This picture doesn't exist."],
          ["NotFound", "This family doesn't exist."],
          ["InvalidRequest", "The picture must be a JPEG, PNG or WebP file."],
        ]);
      }),
    ));

  it("copies a picture between families the user belongs to", () =>
    runTest(
      Effect.gen(function* () {
        const images = yield* StoredImages;
        const alice = yield* createUser("Alice");
        const mallory = yield* createUser("Mallory");
        const [personal] = yield* alice.api.families.list();
        const family = yield* alice.api.families.create({ payload: { name: "Meerts" } });

        const { imageKey } = yield* alice.api.images.upload({
          params: { familyId: personal!.id },
          payload: TINY_PNG,
        });

        const copied = yield* alice.api.images.copy({
          params: { familyId: family.id },
          payload: { sourceFamilyId: personal!.id, imageKey },
        });

        expect(copied.imageKey).not.toBe(imageKey);
        expect(images.get(`families/${family.id}/${copied.imageKey}`)?.bytes).toEqual(TINY_PNG);

        const [malloryFamily] = yield* mallory.api.families.list();

        const stolen = yield* mallory.api.images
          .copy({
            params: { familyId: malloryFamily!.id },
            payload: { sourceFamilyId: personal!.id, imageKey },
          })
          .pipe(Effect.flip);

        expect(stolen._tag).toBe("NotFound");
      }),
    ));

  it("deletes a family's pictures and store with the family", () =>
    runTest(
      Effect.gen(function* () {
        const images = yield* StoredImages;
        const calls = yield* FamilyStoreCalls;
        const alice = yield* createUser("Alice");
        const bob = yield* createUser("Bob");
        const family = yield* alice.api.families.create({ payload: { name: "Meerts" } });
        const kept = yield* alice.api.families.create({ payload: { name: "Kept" } });
        yield* alice.api.images.upload({ params: { familyId: family.id }, payload: TINY_PNG });
        yield* alice.api.images.upload({ params: { familyId: kept.id }, payload: TINY_PNG });
        const invite = yield* alice.api.families.createInvite({ params: { familyId: kept.id } });
        yield* bob.api.families.join({ payload: { code: invite.code } });

        yield* alice.api.families.delete({ params: { familyId: family.id } });
        yield* alice.api.families.removeMember({ params: { familyId: kept.id, userId: bob.id } });

        expect(calls.deleted).toEqual([family.id]);
        expect(calls.disconnected).toEqual([`${kept.id}/${bob.id}`]);
        expect([...images.keys()].map((key) => key.split("/")[1])).toEqual([kept.id]);
      }),
    ));
});

describe("picture cleanup", () => {
  it("deletes unreferenced pictures once they are a day old", () => {
    const dayMs = 24 * 60 * 60 * 1000;

    expect(
      unreferencedImageKeys(
        [
          { key: "families/f/kept.jpg", uploadedMs: 0 },
          { key: "families/f/old.jpg", uploadedMs: 0 },
          { key: "families/f/fresh.jpg", uploadedMs: 2 * dayMs - 1000 },
        ],
        new Set(["kept.jpg"]),
        2 * dayMs,
      ),
    ).toEqual(["families/f/old.jpg"]);
  });
});
