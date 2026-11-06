import * as Axiom from "@alchemy.run/axiom";
import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Alchemy from "alchemy";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import "varlock/auto-load";

export const db = Cloudflare.D1.Database("database", {
  migrations: "../../packages/db/src/migrations",
});

export const images = Cloudflare.R2.Bucket("images");

export const observability = Effect.gen(function* () {
  const { stage } = yield* Alchemy.Stack;
  const datasetName = `lardon-${stage}-logs`;

  const dataset = yield* Axiom.Dataset("logs", {
    name: datasetName,
    kind: "axiom:events:v1",
    description: "lardon application logs",
  });

  const ingest = yield* Axiom.ApiToken("logs-ingest", {
    name: `lardon-${stage}-logs-ingest`,
    datasetCapabilities: {
      [datasetName]: {
        ingest: ["create"],
      },
    },
  });

  return {
    dataset,
    runtimeEnv: {
      AXIOM_API_KEY: ingest.token,
      AXIOM_DATASET: dataset.name,
      AXIOM_EDGE_URL: dataset.edgeDeploymentUrl,
    },
  };
});

export const observabilityEnv = observability.pipe(Effect.map(({ runtimeEnv }) => runtimeEnv));

export const observabilityBindings = {
  AXIOM_API_KEY: observabilityEnv.pipe(Effect.map(({ AXIOM_API_KEY }) => AXIOM_API_KEY)),
  AXIOM_DATASET: observabilityEnv.pipe(Effect.map(({ AXIOM_DATASET }) => AXIOM_DATASET)),
  AXIOM_EDGE_URL: observabilityEnv.pipe(Effect.map(({ AXIOM_EDGE_URL }) => AXIOM_EDGE_URL)),
};

export const server = Cloudflare.Worker("server", {
  main: "../../apps/server/src/index.ts",
  compatibility: {
    flags: ["nodejs_compat"],
  },
  env: {
    DB: db,
    IMAGES: images,
    SYNC_BACKEND: Cloudflare.DurableObject("SyncBackendDO"),
    EMAIL: Cloudflare.Email.SendEmail("Email"),
    EMAIL_FROM: Config.String("EMAIL_FROM"),
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
    CORS_ORIGIN: Config.String("CORS_ORIGIN"),
    BETTER_AUTH_SECRET: Config.Redacted("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: Cloudflare.Worker.URL,
    ...observabilityBindings,
  },
  dev: {
    port: 3000,
  },
});

export type ServerEnv = Cloudflare.InferEnv<typeof server>;

export default Alchemy.Stack(
  "lardon",
  {
    providers: Layer.mergeAll(Cloudflare.providers(), Axiom.providers()),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const observabilityResources = yield* observability;
    const serverWorker = yield* server;

    return {
      server: serverWorker.url,
      axiomDataset: observabilityResources.dataset.name,
    };
  }),
);
