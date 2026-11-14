import { Api, CurrentUser } from "@lardon/api";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { Shares } from "../shares";

export const SharesHandlers = HttpApiBuilder.group(
  Api,
  "shares",
  Effect.fn(function* (handlers) {
    const shares = yield* Shares;

    return handlers.handle(
      "create",
      Effect.fn("shares.create")(function* ({ payload }) {
        const user = yield* CurrentUser;

        return yield* shares.create(user.id, payload);
      }),
    );
  }),
);
