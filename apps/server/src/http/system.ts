import { Api, CurrentUser } from "@lardon/api";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

export const SystemHandlers = HttpApiBuilder.group(
  Api,
  "system",
  (handlers) => handlers.handleAll({ health: () => Effect.void }),
);

export const AccountHandlers = HttpApiBuilder.group(
  Api,
  "account",
  (handlers) => handlers.handleAll({ me: () => CurrentUser }),
);
