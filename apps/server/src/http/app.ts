import { Effect, Layer } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/http";

import { Authentication } from "../authentication";
import { RateLimits, rateLimitRuleFor, tooManyRequests } from "../rate-limits";
import { ApiRoutes } from "./api";

const AuthRoutes = Layer.unwrap(
  Effect.gen(function* () {
    const authentication = yield* Authentication;
    return HttpRouter.add("*", "/api/auth/*", (request) =>
      Effect.gen(function* () {
        const webRequest = yield* HttpServerRequest.toWeb(request).pipe(Effect.orDie);
        return HttpServerResponse.fromWeb(yield* authentication.handle(webRequest));
      }),
    );
  }),
);

const HomeRoute = HttpRouter.add("GET", "/", HttpServerResponse.text("OK"));

const RateLimitMiddleware = HttpRouter.middleware(
  Effect.gen(function* () {
    const rateLimits = yield* RateLimits;
    return (httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const rule = rateLimitRuleFor(
          request.method,
          new URL(request.url, "http://localhost").pathname,
        );
        const client = request.headers["cf-connecting-ip"] ?? "unknown";
        if (rule && !(yield* rateLimits.allow(rule, client))) {
          return HttpServerResponse.jsonUnsafe(
            { _tag: tooManyRequests._tag, message: tooManyRequests.message },
            { status: 429, headers: { "retry-after": "60" } },
          );
        }
        return yield* httpEffect;
      });
  }),
  { global: true },
);

export const AppRoutes = Layer.mergeAll(ApiRoutes, AuthRoutes, HomeRoute, RateLimitMiddleware);
