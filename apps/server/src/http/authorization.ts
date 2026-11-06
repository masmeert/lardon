import { Authorization, CurrentUser, Unauthorized } from "@lardon/api";
import { Effect, Layer } from "effect";
import { HttpServerRequest } from "effect/http";

import { Authentication } from "../authentication";

export const AuthorizationLive = Layer.effect(
  Authorization,
  Effect.gen(function* () {
    const authentication = yield* Authentication;
    return Authorization.of((httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const user = yield* authentication.userFromHeaders(
          new Headers(request.headers as Record<string, string>),
        );
        if (!user) return yield* new Unauthorized({ message: "Sign in to continue." });
        return yield* Effect.provideService(httpEffect, CurrentUser, user);
      }),
    );
  }),
);
