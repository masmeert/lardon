import { share } from "@lardon/db/schema/shares";
import { eq } from "@lardon/db/orm";
import { Effect, Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/http";
import { describe, expect, it } from "vite-plus/test";

import { Database } from "../database";
import { SharePageRoutes } from "../http/share-pages";
import { ImageStorage } from "../image-storage";
import { Shares } from "../shares";
import { StoredImages, TEST_SHARE_ORIGIN, createUser, runTest } from "./environment";

const TINY_PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  ),
  (character) => character.charCodeAt(0),
);

const recipe = {
  title: "Gaufres de Liège",
  servings: 12,
  ingredients: [{ quantity: 500, unit: "g" as const, name: "flour" }],
  steps: ["Knead the dough."],
};

const sharePages = Effect.gen(function* () {
  const context = yield* Effect.context<Shares | ImageStorage>();

  const { handler, dispose } = HttpRouter.toWebHandler(
    SharePageRoutes.pipe(
      Layer.provide(Layer.succeedContext(context)),
      Layer.provide(HttpServer.layerServices),
    ),
    { disableLogger: true },
  );

  yield* Effect.addFinalizer(() => Effect.promise(dispose));

  return (path: string) =>
    Effect.promise(() => handler(new Request(`${TEST_SHARE_ORIGIN}${path}`)));
});

describe("share links", () => {
  it("publishes a family member's recipe with its own copy of the photo", () =>
    runTest(
      Effect.gen(function* () {
        const images = yield* StoredImages;
        const open = yield* sharePages;
        const alice = yield* createUser("Alice");
        const mallory = yield* createUser("Mallory");
        const family = yield* alice.api.families.create({ payload: { name: "Meerts" } });

        const { imageKey } = yield* alice.api.images.upload({
          params: { familyId: family.id },
          payload: TINY_PNG,
        });

        const link = yield* alice.api.shares.create({
          payload: { familyId: family.id, recipeId: "gaufres", recipe, imageKey },
        });

        expect(link.url).toMatch(new RegExp(`^${TEST_SHARE_ORIGIN}/r/[A-Za-z0-9_-]{22}$`));
        expect(link.expiresAt.getTime() - Date.now()).toBeGreaterThan(6.9 * 24 * 60 * 60 * 1000);

        const path = new URL(link.url).pathname;
        const page = yield* open(path);
        const html = yield* Effect.promise(() => page.text());

        expect(page.status).toBe(200);
        expect(page.headers.get("content-type")).toContain("text/html");
        expect(html).toMatch(/<h1 [^>]+>Gaufres de Liège<\/h1>/);
        expect(html).toContain('<meta property="og:title" content="Gaufres de Liège"/>');
        expect(html).toContain(`<meta property="og:image" content="${link.url}/photo"/>`);

        const photo = yield* open(`${path}/photo`);
        expect(photo.headers.get("content-type")).toBe("image/png");
        expect(new Uint8Array(yield* Effect.promise(() => photo.arrayBuffer()))).toEqual(TINY_PNG);
        expect([...images.keys()].filter((key) => key.startsWith("shares/"))).toHaveLength(1);

        const refused = yield* mallory.api.shares
          .create({ payload: { familyId: family.id, recipeId: "gaufres", recipe } })
          .pipe(Effect.flip);

        expect([refused._tag, refused.message]).toEqual(["NotFound", "This family doesn't exist."]);
        expect((yield* open("/r/unknown")).status).toBe(404);
      }),
    ));

  it("expires links after a week and cleans up their photos", () =>
    runTest(
      Effect.gen(function* () {
        const database = yield* Database;
        const images = yield* StoredImages;
        const shares = yield* Shares;
        const open = yield* sharePages;
        const alice = yield* createUser("Alice");
        const [personal] = yield* alice.api.families.list();

        const { imageKey } = yield* alice.api.images.upload({
          params: { familyId: personal!.id },
          payload: TINY_PNG,
        });

        const link = yield* alice.api.shares.create({
          payload: { familyId: personal!.id, recipeId: "gaufres", recipe, imageKey },
        });

        const token = link.url.split("/").at(-1)!;

        yield* database.use((client) =>
          client
            .update(share)
            .set({ expiresAt: new Date(Date.now() - 1000) })
            .where(eq(share.token, token)),
        );

        const expired = yield* open(`/r/${token}`);
        expect(expired.status).toBe(410);
        expect(yield* Effect.promise(() => expired.text())).toContain("This link has expired");
        expect((yield* open(`/r/${token}/photo`)).status).toBe(410);

        for (const [key, image] of images) {
          if (key.startsWith("shares/")) images.set(key, { ...image, uploadedMs: 0 });
        }

        yield* shares.deleteExpired();

        expect(yield* database.use((client) => client.select().from(share))).toEqual([]);
        expect([...images.keys()].filter((key) => key.startsWith("shares/"))).toEqual([]);
        expect((yield* open(`/r/${token}`)).status).toBe(404);
      }),
    ));

  it("hands back the same link while the recipe stays unchanged", () =>
    runTest(
      Effect.gen(function* () {
        const database = yield* Database;
        const images = yield* StoredImages;
        const alice = yield* createUser("Alice");
        const bob = yield* createUser("Bob");
        const family = yield* alice.api.families.create({ payload: { name: "Meerts" } });
        const invite = yield* alice.api.families.createInvite({ params: { familyId: family.id } });
        yield* bob.api.families.join({ payload: { code: invite.code } });

        const { imageKey } = yield* alice.api.images.upload({
          params: { familyId: family.id },
          payload: TINY_PNG,
        });

        const payload = { familyId: family.id, recipeId: "gaufres", recipe, imageKey };
        const first = yield* alice.api.shares.create({ payload });
        const token = first.url.split("/").at(-1)!;

        yield* database.use((client) =>
          client
            .update(share)
            .set({ expiresAt: new Date(Date.now() + 60 * 60 * 1000) })
            .where(eq(share.token, token)),
        );

        const again = yield* alice.api.shares.create({ payload });

        expect(again.url).toBe(first.url);
        expect(again.expiresAt.getTime() - Date.now()).toBeGreaterThan(6.9 * 24 * 60 * 60 * 1000);
        expect([...images.keys()].filter((key) => key.startsWith("shares/"))).toHaveLength(1);

        const edited = yield* alice.api.shares.create({
          payload: { ...payload, recipe: { ...recipe, servings: 6 } },
        });

        const { imageKey: newPhoto } = yield* alice.api.images.upload({
          params: { familyId: family.id },
          payload: TINY_PNG,
        });

        const rephotographed = yield* alice.api.shares.create({
          payload: { ...payload, imageKey: newPhoto },
        });

        const fromBob = yield* bob.api.shares.create({ payload });

        expect(new Set([first.url, edited.url, rephotographed.url, fromBob.url]).size).toBe(4);
      }),
    ));
});
