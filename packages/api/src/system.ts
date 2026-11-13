import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api";

import { Authorization, User } from "./authorization";

export class SystemApi extends HttpApiGroup.make("system", { topLevel: true }).add(
  HttpApiEndpoint.get("health", "/api/health", { success: HttpApiSchema.NoContent }),
) {}

export class AccountApi extends HttpApiGroup.make("account")
  .add(HttpApiEndpoint.get("me", "/api/me", { success: User }))
  .middleware(Authorization) {}
