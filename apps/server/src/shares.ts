import { type ShareLink } from "@lardon/api";
import { eq, isNotNull, lte } from "@lardon/db/orm";
import { share } from "@lardon/db/schema/shares";
import { RecipeSnapshot } from "@lardon/recipes/snapshot";
import { Clock, Context, Effect, Layer, Option, Schema } from "effect";

import { Database } from "./database";
import { Families, missingFamily } from "./families";
import { ImageStorage, familyImagePrefix, unreferencedImageKeys } from "./image-storage";

const SHARE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export const shareImagePrefix = "shares/";

const decodeSnapshot = Schema.decodeUnknownOption(RecipeSnapshot);

function newToken() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export type SharedRecipe =
  | { kind: "active"; recipe: RecipeSnapshot; imageKey: string | null; expiresAt: Date }
  | { kind: "expired" }
  | { kind: "missing" };

export class Shares extends Context.Service<
  Shares,
  {
    readonly origin: string;
    create(
      userId: string,
      input: { familyId: string; recipeId: string; recipe: RecipeSnapshot; imageKey?: string },
    ): Effect.Effect<ShareLink, typeof missingFamily>;
    find(token: string): Effect.Effect<SharedRecipe>;
    deleteExpired(): Effect.Effect<void>;
  }
>()("lardon/server/Shares") {
  static layer(origin: string) {
    return Layer.effect(
      Shares,
      Effect.gen(function* () {
        const database = yield* Database;
        const families = yield* Families;
        const images = yield* ImageStorage;

        return Shares.of({
          origin,
          create: Effect.fn("Shares.create")(function* (userId, input) {
            if (!(yield* families.isMember(userId, input.familyId))) return yield* missingFamily;

            const token = newToken();
            const expiresAt = new Date((yield* Clock.currentTimeMillis) + SHARE_LIFETIME_MS);
            const sharedImageKey = `${token}.${input.imageKey?.split(".")[1]}`;

            const isCopied =
              input.imageKey !== undefined &&
              (yield* images.copy(
                `${familyImagePrefix(input.familyId)}${input.imageKey}`,
                `${shareImagePrefix}${sharedImageKey}`,
              ));

            yield* database.use((client) =>
              client.insert(share).values({
                token,
                recipeId: input.recipeId,
                createdById: userId,
                snapshot: input.recipe,
                imageKey: isCopied ? sharedImageKey : null,
                expiresAt,
              }),
            );

            return { url: `${origin}/r/${token}`, expiresAt };
          }),
          find: Effect.fn("Shares.find")(function* (token) {
            const [row] = yield* database.use((client) =>
              client.select().from(share).where(eq(share.token, token)),
            );

            if (!row) return { kind: "missing" } as const;

            if (row.expiresAt.getTime() <= (yield* Clock.currentTimeMillis)) {
              return { kind: "expired" } as const;
            }

            return Option.match(decodeSnapshot(row.snapshot), {
              onNone: () => ({ kind: "missing" }) as const,
              onSome: (recipe) =>
                ({
                  kind: "active",
                  recipe,
                  imageKey: row.imageKey,
                  expiresAt: row.expiresAt,
                }) as const,
            });
          }),
          deleteExpired: Effect.fn("Shares.deleteExpired")(function* () {
            const nowMs = yield* Clock.currentTimeMillis;

            yield* database.use((client) =>
              client.delete(share).where(lte(share.expiresAt, new Date(nowMs))),
            );

            const kept = yield* database.use((client) =>
              client
                .select({ imageKey: share.imageKey })
                .from(share)
                .where(isNotNull(share.imageKey)),
            );

            yield* images.deleteMany(
              unreferencedImageKeys(
                yield* images.list(shareImagePrefix),
                new Set(kept.flatMap(({ imageKey }) => (imageKey ? [imageKey] : []))),
                nowMs,
              ),
            );
          }),
        });
      }),
    );
  }
}
