import { Effect, Layer, ManagedRuntime } from "effect";
import { HttpRouter, HttpServer } from "effect/http";

import { Authentication } from "./authentication";
import { Database } from "./database";
import { ENV } from "./env.server";
import { Families } from "./families";
import { ApiRoutes } from "./http/api";
import { ImageStorage } from "./image-storage";
import { RecipeStoreBackend } from "./recipe-store-backend";
import { createAuth, getDb } from "./services";

const ServicesLive = Layer.mergeAll(
  Layer.effect(
    Authentication,
    Effect.gen(function* () {
      return Authentication.fromBetterAuth(createAuth((yield* Database).client));
    }),
  ),
  Layer.sync(ImageStorage, () => ImageStorage.fromR2(ENV.IMAGES)),
  Layer.sync(RecipeStoreBackend, () =>
    RecipeStoreBackend.fromDurableObjects(ENV.SYNC_BACKEND as unknown as DurableObjectNamespace),
  ),
).pipe(Layer.provideMerge(Layer.sync(Database, () => Database.make(getDb()))));

export const apiHandler = HttpRouter.toWebHandler(
  ApiRoutes.pipe(Layer.provide(ServicesLive), Layer.provide(HttpServer.layerServices)),
  { disableLogger: true },
).handler;

export const serverRuntime = ManagedRuntime.make(
  Families.layer.pipe(Layer.provideMerge(ServicesLive)),
);
