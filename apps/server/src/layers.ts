import { createAuth } from "@lardon/auth";
import { createDb } from "@lardon/db";
import { signInCodeEmail } from "@lardon/emails";
import { Effect, Layer, ManagedRuntime } from "effect";
import { routerLayer } from "evlog/effect";
import { HttpRouter, HttpServer } from "effect/http";

import { Authentication } from "./authentication";
import { Database } from "./database";
import { ENV } from "./env.server";
import { Families } from "./families";
import { Feed } from "./feed";
import { Follows } from "./follows";
import { FamilyStores, inEuropeanUnion } from "./family-stores";
import { AppRoutes } from "./http/app";
import { ImageStorage } from "./image-storage";
import { Mailer } from "./mailer";
import { Profiles } from "./profiles";
import { RateLimits } from "./rate-limits";
import { Shares } from "./shares";

const InfrastructureLive = Layer.mergeAll(
  Layer.sync(Database, () => Database.make(createDb(ENV))),
  Layer.sync(Mailer, () => Mailer.fromCloudflare(ENV.EMAIL, ENV.EMAIL_FROM)),
  Layer.sync(ImageStorage, () => ImageStorage.fromR2(ENV.IMAGES)),
  Layer.sync(FamilyStores, () =>
    FamilyStores.fromDurableObjects(inEuropeanUnion(ENV.FAMILY_STORES)),
  ),
  Layer.sync(RateLimits, () =>
    RateLimits.fromCloudflare({
      auth: ENV.AUTH_RATE_LIMIT,
      sensitive: ENV.SENSITIVE_RATE_LIMIT,
      api: ENV.API_RATE_LIMIT,
    }),
  ),
);

const ServicesLive = Layer.effect(
  Authentication,
  Effect.gen(function* () {
    const database = yield* Database;
    const mailer = yield* Mailer;
    const families = yield* Families;

    return Authentication.fromBetterAuth(
      createAuth(ENV, database.client, {
        sendSignInCode: (email) =>
          Effect.runPromise(
            Effect.promise(() => signInCodeEmail(email)).pipe(
              Effect.flatMap((message) => mailer.send(message)),
              Effect.andThen(
                ENV.LOG_SIGN_IN_CODES === "true"
                  ? Effect.logInfo(`Sign-in code for ${email.to}: ${email.code}`)
                  : Effect.void,
              ),
            ),
          ),
        afterCreateUser: (userId) => Effect.runPromise(families.createPersonal(userId)),
        beforeDeleteUser: (userId) => Effect.runPromise(families.forgetUser(userId)),
      }),
    );
  }),
).pipe(
  Layer.provideMerge(Feed.layer),
  Layer.provideMerge(Follows.layer),
  Layer.provideMerge(Profiles.layer),
  Layer.provideMerge(Shares.layer(ENV.SHARE_ORIGIN)),
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
    routerLayer(),
  ).pipe(Layer.provide(ServicesLive), Layer.provide(HttpServer.layerServices)),
  { disableLogger: true, memoMap: serverRuntime.memoMap },
).handler;
