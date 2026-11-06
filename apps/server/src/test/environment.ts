import { Api, Authorization, type User } from "@lardon/api";
import { user } from "@lardon/db/schema/auth";
import { createTestDatabase } from "@lardon/db/testing";
import { eq } from "@lardon/db/orm";
import { Context, Effect, Layer, type Scope } from "effect";
import { HttpClientRequest, HttpServer } from "effect/http";
import { HttpApiMiddleware, HttpApiTest } from "effect/http-api";

import { Authentication } from "../authentication";
import { Database } from "../database";
import { ApiHandlers } from "../http/api";
import { ImageStorage, type StoredImage } from "../image-storage";
import { RecipeStoreBackend } from "../recipe-store-backend";

export class DeletedStores extends Context.Service<DeletedStores, string[]>()(
  "lardon/server/test/DeletedStores",
) {}

export class StoredImages extends Context.Service<
  StoredImages,
  Map<string, { bytes: Uint8Array; contentType: string }>
>()("lardon/server/test/StoredImages") {}

const DatabaseTest = Layer.effect(
  Database,
  Effect.promise(() => createTestDatabase()).pipe(Effect.map(Database.make)),
);

const AuthenticationTest = Layer.effect(
  Authentication,
  Effect.gen(function* () {
    const database = yield* Database;
    return Authentication.of({
      userFromHeaders: (headers) =>
        Effect.gen(function* () {
          const userId = /test-user=([^;]+)/.exec(headers.get("cookie") ?? "")?.[1];
          if (!userId) return null;
          const [row] = yield* database.use((client) =>
            client.select().from(user).where(eq(user.id, userId)),
          );
          return row
            ? { id: row.id, name: row.name, email: row.email, image: row.image ?? null }
            : null;
        }),
    });
  }),
);

const RecipeStoreBackendTest = Layer.effect(
  RecipeStoreBackend,
  Effect.gen(function* () {
    const deletedStores = yield* DeletedStores;
    return RecipeStoreBackend.of({
      deleteStore: (storeId) => Effect.sync(() => void deletedStores.push(storeId)),
    });
  }),
);

const ImageStorageTest = Layer.effect(
  ImageStorage,
  Effect.gen(function* () {
    const images = yield* StoredImages;
    return ImageStorage.of({
      put: (key, bytes, contentType) =>
        Effect.sync(() => void images.set(key, { bytes, contentType })),
      get: (key) =>
        Effect.sync((): StoredImage | null => {
          const image = images.get(key);
          return image
            ? { body: new Blob([image.bytes.slice()]).stream(), contentType: image.contentType }
            : null;
        }),
    });
  }),
);

export const TestServer = Layer.mergeAll(ApiHandlers, HttpServer.layerServices).pipe(
  Layer.provideMerge(Layer.mergeAll(AuthenticationTest, RecipeStoreBackendTest, ImageStorageTest)),
  Layer.provideMerge(DatabaseTest),
  Layer.provideMerge(Layer.sync(DeletedStores, () => [])),
  Layer.provideMerge(Layer.sync(StoredImages, () => new Map())),
);

export function signedInAs(userId: string | null) {
  return HttpApiMiddleware.layerClient(Authorization, ({ next, request }) =>
    next(userId ? HttpClientRequest.setHeader(request, "cookie", `test-user=${userId}`) : request),
  );
}

export const clientFor = Effect.fn("clientFor")(function* (userId: string | null) {
  return yield* HttpApiTest.groups(Api, [
    "system",
    "account",
    "families",
    "images",
    "imageFiles",
  ]).pipe(Effect.provide(signedInAs(userId)));
});

export const createUser = Effect.fn("createUser")(function* (name: string) {
  const database = yield* Database;
  const created: User = {
    id: crypto.randomUUID(),
    name,
    email: `${name.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}@example.com`,
    image: null,
  };
  yield* database.use((client) => client.insert(user).values(created));
  return { ...created, api: yield* clientFor(created.id) };
});

export function runTest<A, E>(
  program: Effect.Effect<A, E, Layer.Success<typeof TestServer> | Scope.Scope>,
) {
  return Effect.runPromise(program.pipe(Effect.provide(TestServer), Effect.scoped));
}
