import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";

import { Authorization } from "./authorization";
import { InvalidRequest, NotFound } from "./errors";

export const USERNAME_MIN_LENGTH = 3;

export const USERNAME_MAX_LENGTH = 30;

export const BIO_MAX_LENGTH = 160;

export const Username = Schema.String.check(
  Schema.isPattern(new RegExp(`^[a-z0-9_.]{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$`)),
);

export const Bio = Schema.String.check(Schema.isTrimmed(), Schema.isMaxLength(BIO_MAX_LENGTH));

export const Person = Schema.Struct({
  userId: Schema.String,
  name: Schema.String,
  image: Schema.NullOr(Schema.String),
  username: Schema.String,
});

export type Person = typeof Person.Type;

export const OwnProfile = Schema.Struct({
  ...Person.fields,
  bio: Schema.NullOr(Schema.String),
});

export type OwnProfile = typeof OwnProfile.Type;

export const FollowState = Schema.Literals(["none", "pending", "approved"]);

export type FollowState = typeof FollowState.Type;

export const ProfileView = Schema.Struct({
  ...OwnProfile.fields,
  isSelf: Schema.Boolean,
  following: FollowState,
  follower: FollowState,
  isBlocked: Schema.Boolean,
  recipeCount: Schema.NullOr(Schema.Number),
  followerCount: Schema.NullOr(Schema.Number),
  followingCount: Schema.NullOr(Schema.Number),
});

export type ProfileView = typeof ProfileView.Type;

export class ProfilesApi extends HttpApiGroup.make("profiles")
  .add(
    HttpApiEndpoint.get("me", "/me", {
      success: Schema.Struct({ profile: Schema.NullOr(OwnProfile) }),
    }),
    HttpApiEndpoint.put("save", "/me", {
      payload: Schema.Struct({ username: Username, bio: Bio }),
      success: OwnProfile,
      error: InvalidRequest,
    }),
    HttpApiEndpoint.get("get", "/:username", {
      params: { username: Schema.String.check(Schema.isMaxLength(64)) },
      success: ProfileView,
      error: NotFound,
    }),
  )
  .middleware(Authorization)
  .prefix("/api/profiles") {}
