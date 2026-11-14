import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Alchemy from "alchemy";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";
import "varlock/auto-load";

export const db = Cloudflare.D1.Database("database", {
  jurisdiction: "eu",
  migrations: "../../packages/db/src/migrations",
});

export const images = Cloudflare.R2.Bucket("images", { jurisdiction: "eu" });

export const server = Cloudflare.Worker("server", {
  main: "../../apps/server/src/index.ts",
  compatibility: {
    flags: ["nodejs_compat"],
  },
  env: {
    DB: db,
    IMAGES: images,
    FAMILY_STORES: Cloudflare.DurableObject("FamilyStore"),
    CORS_ORIGIN: Config.String("CORS_ORIGIN"),
    BETTER_AUTH_SECRET: Config.Redacted("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: Cloudflare.Worker.URL,
    SHARE_ORIGIN:
      process.env.APP_ENV === "production" ? "https://lardon.app" : Cloudflare.Worker.URL,
    GOOGLE_CLIENT_ID: Config.String("GOOGLE_CLIENT_ID").pipe(Config.withDefault("")),
    GOOGLE_CLIENT_SECRET: Config.Redacted("GOOGLE_CLIENT_SECRET").pipe(
      Config.withDefault(Redacted.make("")),
    ),
    APPLE_BUNDLE_ID: Config.String("APPLE_BUNDLE_ID").pipe(Config.withDefault("")),
    EMAIL: Cloudflare.Email.SendEmail("Email"),
    EMAIL_FROM: Config.String("EMAIL_FROM"),
    LOG_SIGN_IN_CODES: Alchemy.ALCHEMY_DEV.pipe(Config.map((isDev) => (isDev ? "true" : "false"))),
    AUTH_RATE_LIMIT: Cloudflare.RateLimit("AUTH_RATE_LIMIT", {
      namespaceId: 1001,
      simple: { limit: 20, period: 60 },
    }),
    SENSITIVE_RATE_LIMIT: Cloudflare.RateLimit("SENSITIVE_RATE_LIMIT", {
      namespaceId: 1002,
      simple: { limit: 30, period: 60 },
    }),
    API_RATE_LIMIT: Cloudflare.RateLimit("API_RATE_LIMIT", {
      namespaceId: 1003,
      simple: { limit: 600, period: 60 },
    }),
  },
  domain: process.env.APP_ENV === "production" ? "api.lardon.app" : undefined,
  routes:
    process.env.APP_ENV === "production"
      ? [{ pattern: "lardon.app/r/*", zoneName: "lardon.app" }]
      : undefined,
  crons: ["17 4 * * *"],
  dev: {
    port: Number(process.env.SERVER_DEV_PORT ?? 3000),
  },
});

export type ServerEnv = Cloudflare.InferEnv<typeof server>;

export const website = Cloudflare.Website.Astro("website", {
  rootDir: "../../apps/web",
  astro: { output: "static" },
  assets: { notFoundHandling: "404-page" },
  domain: process.env.APP_ENV === "production" ? "lardon.app" : undefined,
});

export default Alchemy.Stack(
  "lardon",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const serverWorker = yield* server;
    const websiteWorker = yield* website;

    return {
      website: websiteWorker.url,
      server: serverWorker.url,
    };
  }),
);
