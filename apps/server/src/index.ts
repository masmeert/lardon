import { initLogger } from "evlog";
import { createAxiomDrain } from "evlog/axiom";
import { createAuthMiddleware, type BetterAuthInstance } from "evlog/better-auth";
import { evlog, type EvlogVariables } from "evlog/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { ENV } from "./env.server";
import { apiHandler } from "./layers";
import { createAuth } from "./services";
import { handleRecipeSyncRequest, matchRecipeSyncRequest } from "./sync";

export { SyncBackendDO } from "./sync";

initLogger({
  env: { service: "lardon-server" },
});

const identifyUser = createAuthMiddleware((await createAuth()) as BetterAuthInstance, {
  exclude: ["/api/auth/**"],
  maskEmail: true,
});

const app = new Hono<EvlogVariables>();

app.use(evlog({ drain: createAxiomDrain() }));
app.use("*", async (c, next) => {
  await identifyUser(c.get("log"), c.req.raw.headers, c.req.path);
  await next();
});

app.use(
  "/*",
  cors({
    origin: ENV.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", async (c) => (await createAuth()).handler(c.req.raw));

app.all("/api/*", (context) => apiHandler(context.req.raw));
app.get("/images/*", (context) => apiHandler(context.req.raw));

app.get("/", (c) => {
  return c.text("OK");
});

export default {
  fetch(request: Request, env: Env, executionContext: ExecutionContext) {
    const syncRequest = matchRecipeSyncRequest(request);
    return syncRequest
      ? handleRecipeSyncRequest(request, syncRequest, executionContext)
      : app.fetch(request, env, executionContext);
  },
};
