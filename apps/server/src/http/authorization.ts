import { Authorization, CurrentUser, Unauthorized } from "@lardon/api";
import { Effect, Layer } from "effect";
import { HttpServerRequest } from "effect/http";
import { set } from "evlog/effect";

import { Authentication } from "../authentication";

export const AuthorizationLive = Layer.effect(
  Authorization,
  Effect.gen(function* () {
    const authentication = yield* Authentication;

    return Authorization.of((httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;

        const user = yield* authentication.userFromHeaders(new Headers(request.headers));

        if (!user) return yield* new Unauthorized({ message: "Sign in to continue." });
        yield* set({ user: { id: user.id } });

        return yield* Effect.provideService(httpEffect, CurrentUser, user);
      }),
    );
  }),
);

export function asCurrentUser<Success, Failure, Requirements>(
  run: (userId: string) => Effect.Effect<Success, Failure, Requirements>,
) {
  return Effect.flatMap(CurrentUser, (user) => run(user.id));
}
