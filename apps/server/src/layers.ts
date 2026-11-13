import { createAuth } from "@lardon/auth";
import { createDb } from "@lardon/db";
import { Effect, Layer } from "effect";
import { createAxiomDrain } from "evlog/axiom";
import { routerLayer } from "evlog/effect";
import { HttpRouter, HttpServer } from "effect/http";

import { Authentication } from "./authentication";
import { Database } from "./database";
import { ENV } from "./env.server";
import { AppRoutes } from "./http/app";
import { RateLimits } from "./rate-limits";

const DatabaseLive = Layer.sync(Database, () => Database.make(createDb(ENV)));

const ServicesLive = Layer.mergeAll(
  Layer.effect(
    Authentication,
    Effect.gen(function* () {
      const database = yield* Database;

      return Authentication.fromBetterAuth(createAuth(ENV, database.client));
    }),
  ).pipe(Layer.provideMerge(DatabaseLive)),
  Layer.sync(RateLimits, () =>
    RateLimits.fromCloudflare({ auth: ENV.AUTH_RATE_LIMIT, api: ENV.API_RATE_LIMIT }),
  ),
);

export const webHandler = HttpRouter.toWebHandler(
  Layer.mergeAll(
    AppRoutes,
    HttpRouter.cors({
      allowedOrigins: [ENV.CORS_ORIGIN],
      allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["content-type", "authorization", "cookie"],
      credentials: true,
    }),
    routerLayer({ drain: createAxiomDrain() }),
  ).pipe(Layer.provide(ServicesLive), Layer.provide(HttpServer.layerServices)),
  { disableLogger: true },
).handler;
