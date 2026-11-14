import { Api } from "@lardon/api";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { Profiles } from "../profiles";
import { asCurrentUser } from "./authorization";

export const ProfilesHandlers = HttpApiBuilder.group(
  Api,
  "profiles",
  Effect.fn(function* (handlers) {
    const profiles = yield* Profiles;

    return handlers.handleAll({
      me: () =>
        asCurrentUser((userId) => profiles.me(userId).pipe(Effect.map((profile) => ({ profile })))),
      save: ({ payload }) => asCurrentUser((userId) => profiles.save(userId, payload)),
      get: ({ params }) => asCurrentUser((userId) => profiles.find(userId, params.username)),
    });
  }),
);
