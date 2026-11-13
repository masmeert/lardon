import { Context, Effect, Schema } from "effect";
import { HttpClientRequest } from "effect/http";
import { HttpApiMiddleware } from "effect/http-api";

import { Unauthorized } from "./errors";

export const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  image: Schema.NullOr(Schema.String),
});

export type User = typeof User.Type;

export class CurrentUser extends Context.Service<CurrentUser, User>()(
  "lardon/api/authorization/CurrentUser",
) {}

export class Authorization extends HttpApiMiddleware.Service<
  Authorization,
  { provides: CurrentUser; requires: never }
>()("lardon/api/authorization/Authorization", {
  requiredForClient: true,
  error: Unauthorized,
}) {}

export function sendSessionCookie(cookie: Effect.Effect<string>) {
  return HttpApiMiddleware.layerClient(Authorization, ({ next, request }) =>
    Effect.flatMap(cookie, (value) => next(HttpClientRequest.setHeader(request, "cookie", value))),
  );
}
