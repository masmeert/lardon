import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";

import { Authorization } from "./authorization";
import { InvalidRequest, NotFound } from "./errors";
import { FollowState, Person, ProfileView } from "./profiles";

export const Connection = Schema.Struct({
  ...Person.fields,
  status: FollowState,
  since: Schema.DateFromString,
});

export type Connection = typeof Connection.Type;

const personParams = { userId: Schema.String.check(Schema.isMaxLength(64)) };

export class FollowsApi extends HttpApiGroup.make("follows")
  .add(
    HttpApiEndpoint.post("follow", "/", {
      payload: Schema.Struct({ userId: Schema.String.check(Schema.isMaxLength(64)) }),
      success: ProfileView,
      error: [NotFound, InvalidRequest],
    }),
    HttpApiEndpoint.delete("unfollow", "/following/:userId", { params: personParams }),
    HttpApiEndpoint.get("following", "/following", { success: Schema.Array(Connection) }),
    HttpApiEndpoint.get("followers", "/followers", { success: Schema.Array(Connection) }),
    HttpApiEndpoint.delete("removeFollower", "/followers/:userId", { params: personParams }),
    HttpApiEndpoint.post("approve", "/followers/:userId/approve", {
      params: personParams,
      error: NotFound,
    }),
    HttpApiEndpoint.get("blocked", "/blocks", { success: Schema.Array(Connection) }),
    HttpApiEndpoint.put("block", "/blocks/:userId", {
      params: personParams,
      error: [NotFound, InvalidRequest],
    }),
    HttpApiEndpoint.delete("unblock", "/blocks/:userId", { params: personParams }),
  )
  .middleware(Authorization)
  .prefix("/api/follows") {}
