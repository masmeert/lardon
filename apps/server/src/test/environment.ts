import { Api, Authorization, type User } from "@lardon/api";
import { user } from "@lardon/db/schema/auth";
import { createTestDatabase } from "@lardon/db/testing";
import { eq } from "@lardon/db/orm";
import { Context, Effect, Layer, type Scope } from "effect";
import { HttpClientRequest, HttpRouter, HttpServer } from "effect/http";
import { HttpApiMiddleware, HttpApiTest } from "effect/http-api";

import { Authentication } from "../authentication";
import { Database } from "../database";
import { ApiHandlers } from "../http/api";
import { AppRoutes } from "../http/app";
import { RateLimits } from "../rate-limits";

export class RateLimitCounts extends Context.Service<RateLimitCounts, Map<string, number>>()(
  "lardon/server/test/RateLimitCounts",
) {}

export const TEST_RATE_LIMITS = { auth: 3, api: 1000 } as const;

const DatabaseTest = Layer.effect(
  Database,
  Effect.promise(() => createTestDatabase()).pipe(Effect.map((client) => Database.make(client))),
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
      handle: (request) =>
        Effect.succeed(
          Response.json({ handledBy: "better-auth", path: new URL(request.url).pathname }),
        ),
    });
  }),
);

const RateLimitsTest = Layer.effect(
  RateLimits,
  Effect.gen(function* () {
    const counts = yield* RateLimitCounts;

    return RateLimits.of({
      allow: (rule, key) =>
        Effect.sync(() => {
          const count = (counts.get(`${rule}:${key}`) ?? 0) + 1;
          counts.set(`${rule}:${key}`, count);

          return count <= TEST_RATE_LIMITS[rule];
        }),
    });
  }),
);

export const TestServices = Layer.mergeAll(AuthenticationTest, RateLimitsTest).pipe(
  Layer.provideMerge(DatabaseTest),
  Layer.provideMerge(Layer.sync(RateLimitCounts, () => new Map())),
);

export const TestServer = Layer.mergeAll(ApiHandlers, HttpServer.layerServices).pipe(
  Layer.provideMerge(TestServices),
);

export function testWebHandler() {
  return HttpRouter.toWebHandler(
    AppRoutes.pipe(Layer.provide(TestServices), Layer.provide(HttpServer.layerServices)),
    { disableLogger: true },
  );
}

export function signedInAs(userId: string | null) {
  return HttpApiMiddleware.layerClient(Authorization, ({ next, request }) =>
    next(userId ? HttpClientRequest.setHeader(request, "cookie", `test-user=${userId}`) : request),
  );
}

export const clientFor = Effect.fn("clientFor")(function* (userId: string | null) {
  return yield* HttpApiTest.groups(Api, ["system", "account"]).pipe(
    Effect.provide(signedInAs(userId)),
  );
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
