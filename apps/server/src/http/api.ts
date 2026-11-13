import { Api } from "@lardon/api";
import { Layer } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { AuthorizationLive } from "./authorization";
import { AccountHandlers, SystemHandlers } from "./system";

export const ApiHandlers = Layer.mergeAll(SystemHandlers, AccountHandlers).pipe(
  Layer.provideMerge(AuthorizationLive),
);

export const ApiRoutes = HttpApiBuilder.layer(Api, { openapiPath: "/api/openapi.json" }).pipe(
  Layer.provide(ApiHandlers),
);
