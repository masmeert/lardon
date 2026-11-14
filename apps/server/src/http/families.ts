import { Api } from "@lardon/api";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { Families } from "../families";
import { asCurrentUser } from "./authorization";

export const FamiliesHandlers = HttpApiBuilder.group(
  Api,
  "families",
  Effect.fn(function* (handlers) {
    const families = yield* Families;

    return handlers.handleAll({
      list: () => asCurrentUser((userId) => families.list(userId)),
      create: ({ payload }) => asCurrentUser((userId) => families.create(userId, payload.name)),
      join: ({ payload }) => asCurrentUser((userId) => families.join(userId, payload.code)),
      revokeInvite: ({ params }) =>
        asCurrentUser((userId) => families.revokeInvite(userId, params.code)),
      get: ({ params }) => asCurrentUser((userId) => families.get(userId, params.familyId)),
      rename: ({ params, payload }) =>
        asCurrentUser((userId) => families.rename(userId, params.familyId, payload.name)),
      delete: ({ params }) => asCurrentUser((userId) => families.delete(userId, params.familyId)),
      createInvite: ({ params }) =>
        asCurrentUser((userId) => families.createInvite(userId, params.familyId)),
      leave: ({ params }) => asCurrentUser((userId) => families.leave(userId, params.familyId)),
      removeMember: ({ params }) =>
        asCurrentUser((userId) => families.removeMember(userId, params.familyId, params.userId)),
      setMemberRole: ({ params, payload }) =>
        asCurrentUser((userId) =>
          families.setMemberRole(userId, params.familyId, params.userId, payload.role),
        ),
    });
  }),
);
