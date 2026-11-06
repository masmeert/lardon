import { createAuth } from "@lardon/auth";
import { createDb } from "@lardon/db";
import { Effect, Layer, ManagedRuntime } from "effect";
import { HttpRouter, HttpServer } from "effect/http";
import { createAxiomDrain } from "evlog/axiom";
import { routerLayer } from "evlog/effect";

import { Accounts } from "./accounts";
import { Authentication } from "./authentication";
import { Database } from "./database";
import { ENV } from "./env.server";
import { Families } from "./families";
import { AppRoutes } from "./http/app";
import { ImageStorage } from "./image-storage";
import { Mailer, authEmail } from "./mailer";
import { RateLimits } from "./rate-limits";
import { RecipeStoreBackend } from "./recipe-store-backend";

export const axiomDrain = createAxiomDrain();

const InfrastructureLive = Layer.mergeAll(
  Layer.sync(Database, () => Database.make(createDb(ENV))),
  Layer.sync(ImageStorage, () => ImageStorage.fromR2(ENV.IMAGES)),
  Layer.sync(RecipeStoreBackend, () =>
    RecipeStoreBackend.fromDurableObjects(ENV.SYNC_BACKEND as unknown as DurableObjectNamespace),
  ),
  Layer.sync(Mailer, () =>
    ENV.EMAIL ? Mailer.fromCloudflare(ENV.EMAIL, ENV.EMAIL_FROM) : Mailer.logOnly(),
  ),
  Layer.sync(RateLimits, () =>
    RateLimits.fromCloudflare({
      auth: ENV.AUTH_RATE_LIMIT,
      sensitive: ENV.SENSITIVE_RATE_LIMIT,
      api: ENV.API_RATE_LIMIT,
    }),
  ),
);

const AuthenticationLive = Layer.effect(
  Authentication,
  Effect.gen(function* () {
    const database = yield* Database;
    const mailer = yield* Mailer;
    const accounts = yield* Accounts;
    return Authentication.fromBetterAuth(
      createAuth(ENV, database.client, {
        sendEmail: (email) => Effect.runPromise(mailer.send(authEmail(email))),
        beforeDeleteUser: (userId) => Effect.runPromise(accounts.wipe(userId)),
      }),
    );
  }),
);

const ServicesLive = AuthenticationLive.pipe(
  Layer.provideMerge(Accounts.layer),
  Layer.provideMerge(Families.layer),
  Layer.provideMerge(InfrastructureLive),
);

export const serverRuntime = ManagedRuntime.make(ServicesLive);

export const webHandler = HttpRouter.toWebHandler(
  Layer.mergeAll(
    AppRoutes,
    HttpRouter.cors({
      allowedOrigins: [ENV.CORS_ORIGIN],
      allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["content-type", "authorization", "cookie"],
      credentials: true,
    }),
    routerLayer({ drain: axiomDrain }),
  ).pipe(Layer.provide(ServicesLive), Layer.provide(HttpServer.layerServices)),
  { disableLogger: true, memoMap: serverRuntime.memoMap },
).handler;
