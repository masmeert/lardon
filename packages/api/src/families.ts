import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";

import { Authorization } from "./authorization";
import { Forbidden, InvalidRequest, NotFound } from "./errors";

export const FamilyRole = Schema.Literals(["owner", "member"]);

export type FamilyRole = typeof FamilyRole.Type;

export const FamilyName = Schema.String.check(
  Schema.isTrimmed(),
  Schema.isMinLength(1),
  Schema.isMaxLength(80),
);

export const FamilySummary = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  personal: Schema.Boolean,
  role: FamilyRole,
  memberCount: Schema.Number,
  createdAt: Schema.DateFromString,
});

export type FamilySummary = typeof FamilySummary.Type;

export const FamilyMember = Schema.Struct({
  userId: Schema.String,
  name: Schema.String,
  email: Schema.String,
  image: Schema.NullOr(Schema.String),
  role: FamilyRole,
  joinedAt: Schema.DateFromString,
});

export const FamilyInvite = Schema.Struct({
  code: Schema.String,
  createdById: Schema.NullOr(Schema.String),
  expiresAt: Schema.DateFromString,
});

export type FamilyInvite = typeof FamilyInvite.Type;

export const FamilyDetails = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  personal: Schema.Boolean,
  role: FamilyRole,
  createdAt: Schema.DateFromString,
  members: Schema.Array(FamilyMember),
  invites: Schema.Array(FamilyInvite),
});

export type FamilyDetails = typeof FamilyDetails.Type;

const familyParams = { familyId: Schema.String };
const memberParams = { familyId: Schema.String, userId: Schema.String };

export class FamiliesApi extends HttpApiGroup.make("families")
  .add(
    HttpApiEndpoint.get("list", "/", { success: Schema.Array(FamilySummary) }),
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({ name: FamilyName }),
      success: FamilyDetails,
    }),
    HttpApiEndpoint.post("join", "/join", {
      payload: Schema.Struct({ code: Schema.String.check(Schema.isMaxLength(32)) }),
      success: FamilyDetails,
      error: NotFound,
    }),
    HttpApiEndpoint.delete("revokeInvite", "/invites/:code", {
      params: { code: Schema.String },
      error: [NotFound, Forbidden],
    }),
    HttpApiEndpoint.get("get", "/:familyId", {
      params: familyParams,
      success: FamilyDetails,
      error: NotFound,
    }),
    HttpApiEndpoint.patch("rename", "/:familyId", {
      params: familyParams,
      payload: Schema.Struct({ name: FamilyName }),
      success: FamilyDetails,
      error: [NotFound, Forbidden, InvalidRequest],
    }),
    HttpApiEndpoint.delete("delete", "/:familyId", {
      params: familyParams,
      error: [NotFound, Forbidden, InvalidRequest],
    }),
    HttpApiEndpoint.post("createInvite", "/:familyId/invites", {
      params: familyParams,
      success: FamilyInvite,
      error: [NotFound, InvalidRequest],
    }),
    HttpApiEndpoint.post("leave", "/:familyId/leave", {
      params: familyParams,
      error: [NotFound, InvalidRequest],
    }),
    HttpApiEndpoint.delete("removeMember", "/:familyId/members/:userId", {
      params: memberParams,
      success: FamilyDetails,
      error: [NotFound, Forbidden, InvalidRequest],
    }),
    HttpApiEndpoint.patch("setMemberRole", "/:familyId/members/:userId", {
      params: memberParams,
      payload: Schema.Struct({ role: FamilyRole }),
      success: FamilyDetails,
      error: [NotFound, Forbidden, InvalidRequest],
    }),
  )
  .middleware(Authorization)
  .prefix("/api/families") {}
