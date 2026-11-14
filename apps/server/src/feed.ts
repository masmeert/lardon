import { FEED_PAGE_SIZE, type FeedPage, type FeedRecipe, NotFound } from "@lardon/api";
import { RecipeSnapshot } from "@lardon/recipes/snapshot";
import { and, desc, eq, lt, or } from "@lardon/db/orm";
import { user } from "@lardon/db/schema/auth";
import { follow, profile, publishedRecipe } from "@lardon/db/schema/followers";
import { Context, Effect, Layer, Option, Schema } from "effect";

import { Database } from "./database";
import { Families } from "./families";
import { Follows } from "./follows";
import { ImageStorage, type StoredImage, familyImagePrefix } from "./image-storage";
import { personColumns } from "./profiles";

const decodeSnapshot = Schema.decodeUnknownOption(RecipeSnapshot);

export const missingRecipe = new NotFound({
  message: "This recipe isn't shared with you anymore.",
});

const missingImage = new NotFound({ message: "This picture doesn't exist." });

const columns = {
  recipeId: publishedRecipe.recipeId,
  familyId: publishedRecipe.familyId,
  snapshot: publishedRecipe.snapshot,
  imageKey: publishedRecipe.imageKey,
  publishedAt: publishedRecipe.publishedAt,
  updatedAt: publishedRecipe.updatedAt,
  author: personColumns,
};

function toFeedRecipe(row: {
  recipeId: string;
  snapshot: unknown;
  imageKey: string | null;
  publishedAt: Date;
  updatedAt: Date;
  author: FeedRecipe["author"];
}) {
  return Option.map(decodeSnapshot(row.snapshot), (recipe): FeedRecipe => ({
    recipeId: row.recipeId,
    author: row.author,
    recipe,
    imageKey: row.imageKey,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
  }));
}

function parseCursor(cursor: string | undefined) {
  const match = cursor ? /^(\d{1,15})\.([A-Za-z0-9_-]{1,64})$/.exec(cursor) : null;

  return match ? { publishedAt: new Date(Number(match[1])), recipeId: match[2]! } : null;
}

export class Feed extends Context.Service<
  Feed,
  {
    list(
      viewerId: string,
      query: { cursor?: string | undefined; authorId?: string | undefined },
    ): Effect.Effect<FeedPage>;
    get(viewerId: string, recipeId: string): Effect.Effect<FeedRecipe, NotFound>;
    image(
      viewerId: string,
      recipeId: string,
      imageKey: string,
    ): Effect.Effect<StoredImage, NotFound>;
    copyImage(
      viewerId: string,
      recipeId: string,
      familyId: string,
    ): Effect.Effect<{ imageKey: string }, NotFound>;
  }
>()("lardon/server/Feed") {
  static readonly layer = Layer.effect(
    Feed,
    Effect.gen(function* () {
      const database = yield* Database;
      const follows = yield* Follows;
      const families = yield* Families;
      const images = yield* ImageStorage;

      const visibleRow = Effect.fn("Feed.visibleRow")(function* (
        viewerId: string,
        recipeId: string,
      ) {
        const [row] = yield* database.use((client) =>
          client
            .select(columns)
            .from(publishedRecipe)
            .innerJoin(user, eq(user.id, publishedRecipe.authorId))
            .innerJoin(profile, eq(profile.userId, publishedRecipe.authorId))
            .where(eq(publishedRecipe.recipeId, recipeId)),
        );

        if (!row || !(yield* follows.canSee(viewerId, row.author.userId))) {
          return yield* missingRecipe;
        }

        return row;
      });

      return Feed.of({
        list: Effect.fn("Feed.list")(function* (viewerId, query) {
          const cursor = parseCursor(query.cursor);
          const isOwn = query.authorId === viewerId;

          const after =
            cursor === null
              ? undefined
              : or(
                  lt(publishedRecipe.publishedAt, cursor.publishedAt),
                  and(
                    eq(publishedRecipe.publishedAt, cursor.publishedAt),
                    lt(publishedRecipe.recipeId, cursor.recipeId),
                  ),
                );

          const rows = yield* database.use((client) => {
            const base = client
              .select(columns)
              .from(publishedRecipe)
              .innerJoin(user, eq(user.id, publishedRecipe.authorId))
              .innerJoin(profile, eq(profile.userId, publishedRecipe.authorId));

            const scoped = isOwn
              ? base.where(and(eq(publishedRecipe.authorId, viewerId), after))
              : base
                  .innerJoin(
                    follow,
                    and(
                      eq(follow.followeeId, publishedRecipe.authorId),
                      eq(follow.followerId, viewerId),
                      eq(follow.status, "approved"),
                    ),
                  )
                  .where(
                    and(
                      query.authorId === undefined
                        ? undefined
                        : eq(publishedRecipe.authorId, query.authorId),
                      after,
                    ),
                  );

            return scoped
              .orderBy(desc(publishedRecipe.publishedAt), desc(publishedRecipe.recipeId))
              .limit(FEED_PAGE_SIZE + 1);
          });

          const page = rows.slice(0, FEED_PAGE_SIZE);
          const last = page.at(-1);

          return {
            recipes: page.flatMap((row) => Option.toArray(toFeedRecipe(row))),
            nextCursor:
              rows.length > FEED_PAGE_SIZE && last
                ? `${last.publishedAt.getTime()}.${last.recipeId}`
                : null,
          };
        }),

        get: Effect.fn("Feed.get")(function* (viewerId, recipeId) {
          return yield* Option.match(toFeedRecipe(yield* visibleRow(viewerId, recipeId)), {
            onNone: () => Effect.fail(missingRecipe),
            onSome: Effect.succeed,
          });
        }),

        image: Effect.fn("Feed.image")(function* (viewerId, recipeId, imageKey) {
          const row = yield* visibleRow(viewerId, recipeId);

          if (row.imageKey !== imageKey) return yield* missingImage;

          const image = yield* images.get(`${familyImagePrefix(row.familyId)}${imageKey}`);

          return image ?? (yield* missingImage);
        }),

        copyImage: Effect.fn("Feed.copyImage")(function* (viewerId, recipeId, familyId) {
          const row = yield* visibleRow(viewerId, recipeId);

          if (!(yield* families.isMember(viewerId, familyId))) {
            return yield* new NotFound({ message: "This family doesn't exist." });
          }

          if (!row.imageKey) return yield* missingImage;

          const imageKey = `${crypto.randomUUID()}.${row.imageKey.split(".")[1]}`;

          const isCopied = yield* images.copy(
            `${familyImagePrefix(row.familyId)}${row.imageKey}`,
            `${familyImagePrefix(familyId)}${imageKey}`,
          );

          if (!isCopied) return yield* missingImage;

          return { imageKey };
        }),
      });
    }),
  );
}
