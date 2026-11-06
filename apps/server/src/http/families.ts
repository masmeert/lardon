import { Api, CurrentUser } from "@lardon/api";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { Families } from "../families";

export const FamiliesHandlers = HttpApiBuilder.group(
  Api,
  "families",
  Effect.fn(function* (handlers) {
    const families = yield* Families;
    return handlers.handleAll({
      list: () => Effect.flatMap(CurrentUser, (user) => families.list(user.id)),
      create: ({ payload }) =>
        Effect.flatMap(CurrentUser, (user) => families.create(user.id, payload.name)),
      join: ({ payload }) =>
        Effect.flatMap(CurrentUser, (user) => families.join(user.id, payload.code)),
      revokeInvite: ({ params }) =>
        Effect.flatMap(CurrentUser, (user) => families.revokeInvite(user.id, params.code)),
      get: ({ params }) =>
        Effect.flatMap(CurrentUser, (user) => families.get(user.id, params.familyId)),
      rename: ({ params, payload }) =>
        Effect.flatMap(CurrentUser, (user) =>
          families.rename(user.id, params.familyId, payload.name),
        ),
      delete: ({ params }) =>
        Effect.flatMap(CurrentUser, (user) => families.delete(user.id, params.familyId)),
      createInvite: ({ params }) =>
        Effect.flatMap(CurrentUser, (user) => families.createInvite(user.id, params.familyId)),
      leave: ({ params }) =>
        Effect.flatMap(CurrentUser, (user) => families.leave(user.id, params.familyId)),
      removeMember: ({ params }) =>
        Effect.flatMap(CurrentUser, (user) =>
          families.removeMember(user.id, params.familyId, params.userId),
        ),
      setMemberRole: ({ params, payload }) =>
        Effect.flatMap(CurrentUser, (user) =>
          families.setMemberRole(user.id, params.familyId, params.userId, payload.role),
        ),
    });
  }),
);
