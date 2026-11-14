import { type Connection, InvalidRequest, NotFound, type ProfileView } from "@lardon/api";
import { and, desc, eq, or } from "@lardon/db/orm";
import { user } from "@lardon/db/schema/auth";
import { block, follow, profile } from "@lardon/db/schema/followers";
import { Context, Effect, Layer } from "effect";

import { Database } from "./database";
import { Profiles, missingPerson, personColumns } from "./profiles";

function between(followerId: string, followeeId: string) {
  return and(eq(follow.followerId, followerId), eq(follow.followeeId, followeeId));
}

export class Follows extends Context.Service<
  Follows,
  {
    follow(
      userId: string,
      followeeId: string,
    ): Effect.Effect<ProfileView, NotFound | InvalidRequest>;
    unfollow(userId: string, followeeId: string): Effect.Effect<void>;
    following(userId: string): Effect.Effect<Connection[]>;
    followers(userId: string): Effect.Effect<Connection[]>;
    approve(userId: string, followerId: string): Effect.Effect<void, NotFound>;
    removeFollower(userId: string, followerId: string): Effect.Effect<void>;
    blocked(userId: string): Effect.Effect<Connection[]>;
    block(userId: string, blockedId: string): Effect.Effect<void, NotFound | InvalidRequest>;
    unblock(userId: string, blockedId: string): Effect.Effect<void>;
    canSee(viewerId: string, authorId: string): Effect.Effect<boolean>;
  }
>()("lardon/server/Follows") {
  static readonly layer = Layer.effect(
    Follows,
    Effect.gen(function* () {
      const database = yield* Database;
      const profiles = yield* Profiles;

      const connections = Effect.fn("Follows.connections")(function* (
        userId: string,
        side: "followers" | "following",
      ) {
        const [ownColumn, otherColumn] =
          side === "followers"
            ? [follow.followeeId, follow.followerId]
            : [follow.followerId, follow.followeeId];

        return yield* database.use((client) =>
          client
            .select({ ...personColumns, status: follow.status, since: follow.createdAt })
            .from(follow)
            .innerJoin(user, eq(user.id, otherColumn))
            .innerJoin(profile, eq(profile.userId, otherColumn))
            .where(eq(ownColumn, userId))
            .orderBy(desc(follow.createdAt)),
        );
      });

      return Follows.of({
        follow: Effect.fn("Follows.follow")(function* (userId, followeeId) {
          if (followeeId === userId) {
            return yield* new InvalidRequest({ message: "You can't follow yourself." });
          }

          if ((yield* profiles.me(userId)) === null) {
            return yield* new InvalidRequest({
              message: "Choose a username first, so people can see who wants to follow them.",
            });
          }

          const target = yield* profiles.view(userId, followeeId);

          if (target.isBlocked) {
            return yield* new InvalidRequest({
              message: `You blocked @${target.username}. Unblock them to follow them.`,
            });
          }

          if (target.following !== "none") return target;

          yield* database.use((client) =>
            client
              .insert(follow)
              .values({ followerId: userId, followeeId, status: "pending" })
              .onConflictDoNothing(),
          );

          return { ...target, following: "pending" };
        }),

        unfollow: Effect.fn("Follows.unfollow")(function* (userId, followeeId) {
          yield* database.use((client) => client.delete(follow).where(between(userId, followeeId)));
        }),

        following: (userId) => connections(userId, "following"),

        followers: (userId) => connections(userId, "followers"),

        approve: Effect.fn("Follows.approve")(function* (userId, followerId) {
          const [approved] = yield* database.use((client) =>
            client
              .update(follow)
              .set({ status: "approved" })
              .where(between(followerId, userId))
              .returning(),
          );

          if (!approved) {
            return yield* new NotFound({ message: "This request was withdrawn." });
          }
        }),

        removeFollower: Effect.fn("Follows.removeFollower")(function* (userId, followerId) {
          yield* database.use((client) => client.delete(follow).where(between(followerId, userId)));
        }),

        blocked: Effect.fn("Follows.blocked")(function* (userId) {
          const rows = yield* database.use((client) =>
            client
              .select({ ...personColumns, since: block.createdAt })
              .from(block)
              .innerJoin(user, eq(user.id, block.blockedId))
              .innerJoin(profile, eq(profile.userId, block.blockedId))
              .where(eq(block.blockerId, userId))
              .orderBy(desc(block.createdAt)),
          );

          return rows.map((row) => ({ ...row, status: "none" as const }));
        }),

        block: Effect.fn("Follows.block")(function* (userId, blockedId) {
          if (blockedId === userId) {
            return yield* new InvalidRequest({ message: "You can't block yourself." });
          }

          const [target] = yield* database.use((client) =>
            client.select({ id: user.id }).from(user).where(eq(user.id, blockedId)),
          );

          if (!target) return yield* missingPerson;

          yield* database.use((client) =>
            client.batch([
              client.insert(block).values({ blockerId: userId, blockedId }).onConflictDoNothing(),
              client
                .delete(follow)
                .where(or(between(userId, blockedId), between(blockedId, userId))),
            ]),
          );
        }),

        unblock: Effect.fn("Follows.unblock")(function* (userId, blockedId) {
          yield* database.use((client) =>
            client
              .delete(block)
              .where(and(eq(block.blockerId, userId), eq(block.blockedId, blockedId))),
          );
        }),

        canSee: Effect.fn("Follows.canSee")(function* (viewerId, authorId) {
          if (viewerId === authorId) return true;

          const [row] = yield* database.use((client) =>
            client
              .select({ status: follow.status })
              .from(follow)
              .where(between(viewerId, authorId)),
          );

          return row?.status === "approved";
        }),
      });
    }),
  );
}
