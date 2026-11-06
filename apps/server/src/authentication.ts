import type { User } from "@lardon/api";
import type { createAuth } from "@lardon/auth";
import { Context, Effect } from "effect";

export class Authentication extends Context.Service<
  Authentication,
  {
    userFromHeaders(headers: Headers): Effect.Effect<User | null>;
    handle(request: Request): Effect.Effect<Response>;
  }
>()("lardon/server/Authentication") {
  static fromBetterAuth(auth: ReturnType<typeof createAuth>) {
    return Authentication.of({
      userFromHeaders: Effect.fn("Authentication.userFromHeaders")(function* (headers: Headers) {
        const session = yield* Effect.promise(() => auth.api.getSession({ headers }));
        return session
          ? {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
              image: session.user.image ?? null,
            }
          : null;
      }),
      handle: (request) => Effect.promise(() => auth.handler(request)),
    });
  }
}
