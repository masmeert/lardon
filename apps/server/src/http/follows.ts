import { Api } from "@lardon/api";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { Follows } from "../follows";
import { asCurrentUser } from "./authorization";

export const FollowsHandlers = HttpApiBuilder.group(
  Api,
  "follows",
  Effect.fn(function* (handlers) {
    const follows = yield* Follows;

    return handlers.handleAll({
      follow: ({ payload }) => asCurrentUser((userId) => follows.follow(userId, payload.userId)),
      unfollow: ({ params }) => asCurrentUser((userId) => follows.unfollow(userId, params.userId)),
      following: () => asCurrentUser((userId) => follows.following(userId)),
      followers: () => asCurrentUser((userId) => follows.followers(userId)),
      removeFollower: ({ params }) =>
        asCurrentUser((userId) => follows.removeFollower(userId, params.userId)),
      approve: ({ params }) => asCurrentUser((userId) => follows.approve(userId, params.userId)),
      blocked: () => asCurrentUser((userId) => follows.blocked(userId)),
      block: ({ params }) => asCurrentUser((userId) => follows.block(userId, params.userId)),
      unblock: ({ params }) => asCurrentUser((userId) => follows.unblock(userId, params.userId)),
    });
  }),
);
