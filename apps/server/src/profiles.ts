import {
  type FollowState,
  InvalidRequest,
  NotFound,
  type OwnProfile,
  type ProfileView,
} from "@lardon/api";
import { and, count, eq, or } from "@lardon/db/orm";
import { user } from "@lardon/db/schema/auth";
import { block, follow, profile, publishedRecipe } from "@lardon/db/schema/followers";
import { Context, Effect, Layer } from "effect";

import { Database } from "./database";

export const missingPerson = new NotFound({
  message: "No one has this username. Check the spelling and try again.",
});

export const personColumns = {
  userId: user.id,
  name: user.name,
  image: user.image,
  username: profile.username,
};

export class Profiles extends Context.Service<
  Profiles,
  {
    me(userId: string): Effect.Effect<OwnProfile | null>;
    save(
      userId: string,
      input: { username: string; bio: string },
    ): Effect.Effect<OwnProfile, InvalidRequest>;
    find(viewerId: string, username: string): Effect.Effect<ProfileView, NotFound>;
    view(viewerId: string, userId: string): Effect.Effect<ProfileView, NotFound>;
  }
>()("lardon/server/Profiles") {
  static readonly layer = Layer.effect(
    Profiles,
    Effect.gen(function* () {
      const database = yield* Database;

      const me = Effect.fn("Profiles.me")(function* (userId: string) {
        const [row] = yield* database.use((client) =>
          client
            .select({ ...personColumns, bio: profile.bio })
            .from(profile)
            .innerJoin(user, eq(user.id, profile.userId))
            .where(eq(profile.userId, userId)),
        );

        return row ?? null;
      });

      const view = Effect.fn("Profiles.view")(function* (
        viewerId: string,
        where: { userId: string } | { username: string },
      ) {
        const [row] = yield* database.use((client) =>
          client
            .select({ ...personColumns, bio: profile.bio })
            .from(profile)
            .innerJoin(user, eq(user.id, profile.userId))
            .where(
              "userId" in where
                ? eq(profile.userId, where.userId)
                : eq(profile.username, where.username.toLowerCase()),
            ),
        );

        if (!row) return yield* missingPerson;

        const [follows, blocks] = yield* database.use((client) =>
          Promise.all([
            client
              .select()
              .from(follow)
              .where(
                or(
                  and(eq(follow.followerId, viewerId), eq(follow.followeeId, row.userId)),
                  and(eq(follow.followerId, row.userId), eq(follow.followeeId, viewerId)),
                ),
              ),
            client
              .select()
              .from(block)
              .where(
                or(
                  and(eq(block.blockerId, viewerId), eq(block.blockedId, row.userId)),
                  and(eq(block.blockerId, row.userId), eq(block.blockedId, viewerId)),
                ),
              ),
          ]),
        );

        if (blocks.some((entry) => entry.blockerId === row.userId)) return yield* missingPerson;

        function stateOf(followerId: string): FollowState {
          return follows.find((entry) => entry.followerId === followerId)?.status ?? "none";
        }

        const isSelf = row.userId === viewerId;

        const counts =
          isSelf || stateOf(viewerId) === "approved"
            ? yield* database.use((client) =>
                Promise.all(
                  [
                    client
                      .select({ total: count() })
                      .from(publishedRecipe)
                      .where(eq(publishedRecipe.authorId, row.userId)),
                    client
                      .select({ total: count() })
                      .from(follow)
                      .where(and(eq(follow.followeeId, row.userId), eq(follow.status, "approved"))),
                    client
                      .select({ total: count() })
                      .from(follow)
                      .where(and(eq(follow.followerId, row.userId), eq(follow.status, "approved"))),
                  ].map(async (query) => (await query)[0]?.total ?? 0),
                ),
              )
            : null;

        return {
          ...row,
          isSelf,
          following: isSelf ? "none" : stateOf(viewerId),
          follower: isSelf ? "none" : stateOf(row.userId),
          isBlocked: blocks.some((entry) => entry.blockerId === viewerId),
          recipeCount: counts?.[0] ?? null,
          followerCount: counts?.[1] ?? null,
          followingCount: counts?.[2] ?? null,
        } satisfies ProfileView;
      });

      return Profiles.of({
        me,
        save: Effect.fn("Profiles.save")(function* (userId, input) {
          const [taken] = yield* database.use((client) =>
            client
              .select({ userId: profile.userId })
              .from(profile)
              .where(eq(profile.username, input.username)),
          );

          if (taken && taken.userId !== userId) {
            return yield* new InvalidRequest({
              message: `@${input.username} is taken. Try another username.`,
            });
          }

          const bio = input.bio === "" ? null : input.bio;

          yield* database.use((client) =>
            client
              .insert(profile)
              .values({ userId, username: input.username, bio })
              .onConflictDoUpdate({
                target: profile.userId,
                set: { username: input.username, bio, updatedAt: new Date() },
              }),
          );

          const saved = yield* me(userId);

          return saved ?? (yield* Effect.die("The profile was just saved."));
        }),
        find: (viewerId, username) => view(viewerId, { username }),
        view: (viewerId, userId) => view(viewerId, { userId }),
      });
    }),
  );
}
