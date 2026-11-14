import { readFileSync, readdirSync } from "node:fs";
import { builtinModules } from "node:module";
import type { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

import { Miniflare } from "miniflare";
import { rolldown } from "rolldown";
import { Api, sendSessionCookie } from "@lardon/api";
import { Effect, Layer, Schema } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/http";
import { HttpApiClient } from "effect/http-api";
import { WebSocket } from "ws";

import type { FamilyStore } from "../family-store";

const decodeSignIn = Schema.decodeUnknownSync(
  Schema.Struct({ user: Schema.Struct({ id: Schema.String }) }),
);

const appOrigin = "http://localhost";

const migrationsFolder = fileURLToPath(
  new URL("../../../../packages/db/src/migrations", import.meta.url).href,
);

async function bundleServer() {
  const bundle = await rolldown({
    input: fileURLToPath(new URL("../index.ts", import.meta.url).href),
    platform: "neutral",
    external: [/^cloudflare:/, /^node:/, ...builtinModules],
    resolve: { conditionNames: ["workerd", "worker", "browser", "import", "default"] },
    logLevel: "silent",
  });

  const { output } = await bundle.generate({ format: "esm", codeSplitting: false });
  await bundle.close();

  return output.flatMap((chunk) =>
    chunk.type === "chunk"
      ? [{ type: "ESModule" as const, path: `/worker/${chunk.fileName}`, contents: chunk.code }]
      : [],
  );
}

export async function startWorker() {
  const logs: string[] = [];
  const limit = { simple: { limit: 1000, period: 60 } };

  const miniflare = new Miniflare({
    modules: await bundleServer(),
    modulesRoot: "/worker",
    compatibilityDate: "2026-07-01",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: "lardon-test" },
    r2Buckets: ["IMAGES"],
    durableObjects: { FAMILY_STORES: { className: "FamilyStore", useSQLite: true } },
    ratelimits: {
      AUTH_RATE_LIMIT: { namespace_id: "1001", ...limit },
      SENSITIVE_RATE_LIMIT: { namespace_id: "1002", ...limit },
      API_RATE_LIMIT: { namespace_id: "1003", ...limit },
    },
    email: { send_email: [{ name: "EMAIL" }] },
    bindings: {
      CORS_ORIGIN: appOrigin,
      BETTER_AUTH_SECRET: "a-test-secret-that-is-at-least-32-characters",
      BETTER_AUTH_URL: appOrigin,
      SHARE_ORIGIN: appOrigin,
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      APPLE_BUNDLE_ID: "",
      EMAIL_FROM: "noreply@lardon.app",
      LOG_SIGN_IN_CODES: "true",
    },
    handleRuntimeStdio: (stdout: Readable, stderr: Readable) => {
      for (const stream of [stdout, stderr]) {
        stream.on("data", (chunk: Buffer) => logs.push(chunk.toString()));
      }
    },
  });

  const url = await miniflare.ready;
  const database = await miniflare.getD1Database("DB");

  const migrations = readdirSync(migrationsFolder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const folder of migrations) {
    const statements = readFileSync(`${migrationsFolder}/${folder}/migration.sql`, "utf8")
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    await database.batch(statements.map((statement) => database.prepare(statement)));
  }

  const origin = url.origin;

  async function signIn(email: string) {
    await fetch(`${origin}/api/auth/email-otp/send-verification-otp`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: appOrigin },
      body: JSON.stringify({ email, type: "sign-in" }),
    });

    const code = await waitFor(
      () => logs.join("").match(new RegExp(`Sign-in code for ${email}: (\\d{6})`))?.[1],
    );

    const response = await fetch(`${origin}/api/auth/sign-in/email-otp`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: appOrigin },
      body: JSON.stringify({ email, otp: code }),
    });

    const { user } = decodeSignIn(await response.json());

    return {
      id: user.id,
      cookie: response.headers
        .getSetCookie()
        .map((header) => header.split(";")[0])
        .join("; "),
    };
  }

  async function request(cookie: string, path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("cookie", cookie);
    headers.set("origin", appOrigin);

    return fetch(`${origin}${path}`, { ...init, headers });
  }

  const apiClient = HttpApiClient.make(Api, {
    baseUrl: origin,
    transformClient: HttpClient.mapRequest(HttpClientRequest.setHeader("origin", appOrigin)),
  });

  function api(cookie: string) {
    return function call<Success, Failure>(
      request: (client: Effect.Success<typeof apiClient>) => Effect.Effect<Success, Failure>,
    ) {
      return Effect.runPromise(
        apiClient.pipe(
          Effect.flatMap(request),
          Effect.provide(
            Layer.mergeAll(FetchHttpClient.layer, sendSessionCookie(Effect.succeed(cookie))),
          ),
        ),
      );
    };
  }

  function syncSocket(cookie: string, familyId: string) {
    return new WebSocket(`${origin.replace("http", "ws")}/sync/${familyId}`, {
      headers: { cookie },
    });
  }

  async function familyStore(familyId: string) {
    const bindings = await miniflare.getBindings<{
      FAMILY_STORES: DurableObjectNamespace<FamilyStore>;
    }>();

    return bindings.FAMILY_STORES.getByName(familyId);
  }

  async function cleanUp(familyId: string, nowMs: number) {
    await (await familyStore(familyId)).cleanUp(nowMs);
  }

  return {
    origin,
    signIn,
    request,
    api,
    syncSocket,
    cleanUp,
    familyStore,
    images: () => miniflare.getR2Bucket("IMAGES"),
    dispose: () => miniflare.dispose(),
  };
}

export async function waitFor<Value>(
  read: () => Value | undefined | Promise<Value | undefined>,
  timeoutMs = 5000,
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const value = await read();

    if (value !== undefined) return value;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  throw new Error(`Timed out after ${timeoutMs} ms`);
}
