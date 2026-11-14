import {
  type FamilyDetails,
  type FamilyInvite,
  type FamilyRole,
  type FamilySummary,
  Forbidden,
  InvalidRequest,
  NotFound,
} from "@lardon/api";
import { and, asc, eq, gt, isNull, ne, sql } from "@lardon/db/orm";
import { user } from "@lardon/db/schema/auth";
import { family, familyInvite, familyMember } from "@lardon/db/schema/families";
import { publishedRecipe } from "@lardon/db/schema/followers";
import { Clock, Context, Effect, Layer } from "effect";

import { Database } from "./database";
import { FamilyStores } from "./family-stores";
import { ImageStorage, familyImagePrefix } from "./image-storage";
import { formatInviteCode, generateInviteCode, normalizeInviteCode } from "./invite-code";

const INVITE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const joinOrder = [asc(familyMember.joinedAt), asc(sql`${familyMember}.rowid`)];

export const missingFamily = new NotFound({ message: "This family doesn't exist." });

const missingMember = new NotFound({ message: "This person isn't a member of the family." });

function membershipOf(familyId: string, userId: string) {
  return and(eq(familyMember.familyId, familyId), eq(familyMember.userId, userId));
}

function publishedBy(familyId: string, userId: string) {
  return and(eq(publishedRecipe.familyId, familyId), eq(publishedRecipe.authorId, userId));
}

export class Families extends Context.Service<
  Families,
  {
    list(userId: string): Effect.Effect<FamilySummary[]>;
    get(userId: string, familyId: string): Effect.Effect<FamilyDetails, NotFound>;
    create(userId: string, name: string): Effect.Effect<FamilyDetails, InvalidRequest>;
    rename(
      userId: string,
      familyId: string,
      name: string,
    ): Effect.Effect<FamilyDetails, NotFound | Forbidden | InvalidRequest>;
    delete(
      userId: string,
      familyId: string,
    ): Effect.Effect<void, NotFound | Forbidden | InvalidRequest>;
    createInvite(
      userId: string,
      familyId: string,
    ): Effect.Effect<FamilyInvite, NotFound | InvalidRequest>;
    revokeInvite(userId: string, code: string): Effect.Effect<void, NotFound | Forbidden>;
    join(userId: string, code: string): Effect.Effect<FamilyDetails, NotFound | InvalidRequest>;
    leave(userId: string, familyId: string): Effect.Effect<void, NotFound | InvalidRequest>;
    removeMember(
      userId: string,
      familyId: string,
      memberId: string,
    ): Effect.Effect<FamilyDetails, NotFound | Forbidden | InvalidRequest>;
    setMemberRole(
      userId: string,
      familyId: string,
      memberId: string,
      role: FamilyRole,
    ): Effect.Effect<FamilyDetails, NotFound | Forbidden | InvalidRequest>;
    isMember(userId: string, familyId: string): Effect.Effect<boolean>;
    createPersonal(userId: string): Effect.Effect<void>;
    forgetUser(userId: string): Effect.Effect<void>;
  }
>()("lardon/server/Families") {
  static readonly layer = Layer.effect(
    Families,
    Effect.gen(function* () {
      const database = yield* Database;
      const familyStores = yield* FamilyStores;
      const images = yield* ImageStorage;

      const requireMember = Effect.fn("Families.requireMember")(function* (
        familyId: string,
        userId: string,
      ) {
        const [membership] = yield* database.use((client) =>
          client
            .select({ role: familyMember.role, personalForUserId: family.personalForUserId })
            .from(familyMember)
            .innerJoin(family, eq(family.id, familyMember.familyId))
            .where(membershipOf(familyId, userId)),
        );

        if (!membership) return yield* missingFamily;

        return { role: membership.role, personal: membership.personalForUserId !== null };
      });

      const requireShared = Effect.fn("Families.requireShared")(function* (
        familyId: string,
        userId: string,
        refusal: string,
      ) {
        const membership = yield* requireMember(familyId, userId);

        if (membership.personal) return yield* new InvalidRequest({ message: refusal });

        return membership.role;
      });

      const requireOwner = Effect.fn("Families.requireOwner")(function* (
        familyId: string,
        userId: string,
      ) {
        if ((yield* requireMember(familyId, userId)).role !== "owner") {
          return yield* new Forbidden({
            message: "Only family owners can do this. Ask an owner of the family.",
          });
        }
      });

      const requireNoOtherFamily = Effect.fn("Families.requireNoOtherFamily")(function* (
        userId: string,
        allowedFamilyId?: string,
      ) {
        const shared = yield* database.use((client) =>
          client
            .select({ familyId: familyMember.familyId })
            .from(familyMember)
            .innerJoin(family, eq(family.id, familyMember.familyId))
            .where(and(eq(familyMember.userId, userId), isNull(family.personalForUserId))),
        );

        if (shared.some((membership) => membership.familyId !== allowedFamilyId)) {
          return yield* new InvalidRequest({
            message: "You're already in a family. Leave it before you create or join another one.",
          });
        }
      });

      const get = Effect.fn("Families.get")(function* (userId: string, familyId: string) {
        const { role } = yield* requireMember(familyId, userId);
        const now = new Date(yield* Clock.currentTimeMillis);

        const [[row], members, invites] = yield* database.use((client) =>
          Promise.all([
            client.select().from(family).where(eq(family.id, familyId)),
            client
              .select({
                userId: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: familyMember.role,
                joinedAt: familyMember.joinedAt,
              })
              .from(familyMember)
              .innerJoin(user, eq(user.id, familyMember.userId))
              .where(eq(familyMember.familyId, familyId))
              .orderBy(...joinOrder),
            client
              .select()
              .from(familyInvite)
              .where(and(eq(familyInvite.familyId, familyId), gt(familyInvite.expiresAt, now)))
              .orderBy(asc(familyInvite.expiresAt)),
          ]),
        );

        if (!row) return yield* missingFamily;

        return {
          id: row.id,
          name: row.name,
          personal: row.personalForUserId !== null,
          role,
          createdAt: row.createdAt,
          members,
          invites: invites.map((invite) => ({
            code: formatInviteCode(invite.code),
            createdById: invite.createdById,
            expiresAt: invite.expiresAt,
          })),
        };
      });

      const insert = Effect.fn("Families.insert")(function* (
        userId: string,
        values: { name: string; personalForUserId?: string },
      ) {
        const familyId = crypto.randomUUID();
        yield* database.use((client) =>
          client.batch([
            client.insert(family).values({ id: familyId, ...values }),
            client.insert(familyMember).values({ familyId, userId, role: "owner" }),
          ]),
        );

        return familyId;
      });

      const destroy = Effect.fn("Families.destroy")(function* (familyId: string) {
        yield* database.use((client) => client.delete(family).where(eq(family.id, familyId)));
        yield* familyStores.delete(familyId);
        yield* images.deleteMany(
          (yield* images.list(familyImagePrefix(familyId))).map((image) => image.key),
        );
      });

      const depart = Effect.fn("Families.depart")(function* (userId: string, familyId: string) {
        const { role } = yield* requireMember(familyId, userId);

        const otherMembers = yield* database.use((client) =>
          client
            .select({ userId: familyMember.userId, role: familyMember.role })
            .from(familyMember)
            .where(and(eq(familyMember.familyId, familyId), ne(familyMember.userId, userId)))
            .orderBy(...joinOrder),
        );

        const [successor] = otherMembers;

        if (!successor) return yield* destroy(familyId);

        if (role === "owner" && !otherMembers.some((member) => member.role === "owner")) {
          yield* database.use((client) =>
            client.batch([
              client
                .update(familyMember)
                .set({ role: "owner" })
                .where(membershipOf(familyId, successor.userId)),
              client.delete(familyMember).where(membershipOf(familyId, userId)),
              client.delete(publishedRecipe).where(publishedBy(familyId, userId)),
            ]),
          );
        } else {
          yield* database.use((client) =>
            client.batch([
              client.delete(familyMember).where(membershipOf(familyId, userId)),
              client.delete(publishedRecipe).where(publishedBy(familyId, userId)),
            ]),
          );
        }

        yield* familyStores.disconnect(familyId, userId);
      });

      return Families.of({
        list: Effect.fn("Families.list")((userId: string) =>
          database
            .use((client) =>
              client
                .select({
                  id: family.id,
                  name: family.name,
                  personalForUserId: family.personalForUserId,
                  role: familyMember.role,
                  memberCount: sql<number>`(select count(*) from ${familyMember} as member where member.family_id = ${family.id})`,
                  createdAt: family.createdAt,
                })
                .from(familyMember)
                .innerJoin(family, eq(family.id, familyMember.familyId))
                .where(eq(familyMember.userId, userId))
                .orderBy(sql`${family.personalForUserId} is null`, asc(family.name)),
            )
            .pipe(
              Effect.map((rows) =>
                rows.map(({ personalForUserId, ...row }) => ({
                  ...row,
                  personal: personalForUserId !== null,
                })),
              ),
            ),
        ),

        get,

        create: Effect.fn("Families.create")(function* (userId: string, name: string) {
          yield* requireNoOtherFamily(userId);

          return yield* get(userId, yield* insert(userId, { name })).pipe(Effect.orDie);
        }),

        rename: Effect.fn("Families.rename")(function* (
          userId: string,
          familyId: string,
          name: string,
        ) {
          yield* requireShared(familyId, userId, "Your own recipes can't be renamed.");
          yield* requireOwner(familyId, userId);
          yield* database.use((client) =>
            client.update(family).set({ name }).where(eq(family.id, familyId)),
          );

          return yield* get(userId, familyId);
        }),

        delete: Effect.fn("Families.delete")(function* (userId: string, familyId: string) {
          yield* requireShared(
            familyId,
            userId,
            "Your own recipes are deleted only with your account.",
          );
          yield* requireOwner(familyId, userId);
          yield* destroy(familyId);
        }),

        createInvite: Effect.fn("Families.createInvite")(function* (
          userId: string,
          familyId: string,
        ) {
          yield* requireShared(
            familyId,
            userId,
            "Nobody can join your own recipes. Create a family to share recipes with others.",
          );
          const code = generateInviteCode();
          const expiresAt = new Date((yield* Clock.currentTimeMillis) + INVITE_LIFETIME_MS);
          yield* database.use((client) =>
            client.insert(familyInvite).values({ code, familyId, createdById: userId, expiresAt }),
          );

          return { code: formatInviteCode(code), createdById: userId, expiresAt };
        }),

        revokeInvite: Effect.fn("Families.revokeInvite")(function* (
          userId: string,
          rawCode: string,
        ) {
          const code = normalizeInviteCode(rawCode);

          const [invite] = yield* database.use((client) =>
            client.select().from(familyInvite).where(eq(familyInvite.code, code)),
          );

          if (!invite) return yield* new NotFound({ message: "This invite doesn't exist." });
          const { role } = yield* requireMember(invite.familyId, userId);

          if (role !== "owner" && invite.createdById !== userId) {
            return yield* new Forbidden({
              message: "Only the person who created this invite or a family owner can revoke it.",
            });
          }

          yield* database.use((client) =>
            client.delete(familyInvite).where(eq(familyInvite.code, code)),
          );
        }),

        join: Effect.fn("Families.join")(function* (userId: string, rawCode: string) {
          const now = new Date(yield* Clock.currentTimeMillis);

          const [invite] = yield* database.use((client) =>
            client
              .select()
              .from(familyInvite)
              .where(
                and(
                  eq(familyInvite.code, normalizeInviteCode(rawCode)),
                  gt(familyInvite.expiresAt, now),
                ),
              ),
          );

          if (!invite) {
            return yield* new NotFound({
              message: "This invite code is invalid or has expired. Ask for a new one.",
            });
          }

          yield* requireNoOtherFamily(userId, invite.familyId);

          yield* database.use((client) =>
            client
              .insert(familyMember)
              .values({ familyId: invite.familyId, userId, role: "member" })
              .onConflictDoNothing(),
          );

          return yield* get(userId, invite.familyId);
        }),

        leave: Effect.fn("Families.leave")(function* (userId: string, familyId: string) {
          yield* requireShared(familyId, userId, "You can't leave your own recipes.");
          yield* depart(userId, familyId);
        }),

        removeMember: Effect.fn("Families.removeMember")(function* (
          userId: string,
          familyId: string,
          memberId: string,
        ) {
          if (memberId === userId) {
            return yield* new InvalidRequest({
              message: "You can't remove yourself. Leave the family instead.",
            });
          }

          yield* requireOwner(familyId, userId);

          const [[removed]] = yield* database.use((client) =>
            client.batch([
              client.delete(familyMember).where(membershipOf(familyId, memberId)).returning(),
              client.delete(publishedRecipe).where(publishedBy(familyId, memberId)),
            ]),
          );

          if (!removed) {
            return yield* missingMember;
          }

          yield* familyStores.disconnect(familyId, memberId);

          return yield* get(userId, familyId);
        }),

        setMemberRole: Effect.fn("Families.setMemberRole")(function* (
          userId: string,
          familyId: string,
          memberId: string,
          role: FamilyRole,
        ) {
          yield* requireOwner(familyId, userId);

          if (role === "member") {
            const owners = yield* database.use((client) =>
              client
                .select({ userId: familyMember.userId })
                .from(familyMember)
                .where(and(eq(familyMember.familyId, familyId), eq(familyMember.role, "owner"))),
            );

            if (owners.length === 1 && owners[0]?.userId === memberId) {
              return yield* new InvalidRequest({
                message: "A family needs at least one owner. Make someone else an owner first.",
              });
            }
          }

          const [updated] = yield* database.use((client) =>
            client
              .update(familyMember)
              .set({ role })
              .where(membershipOf(familyId, memberId))
              .returning(),
          );

          if (!updated) {
            return yield* missingMember;
          }

          return yield* get(userId, familyId);
        }),

        isMember: Effect.fn("Families.isMember")((userId: string, familyId: string) =>
          requireMember(familyId, userId).pipe(
            Effect.as(true),
            Effect.catchTag("NotFound", () => Effect.succeed(false)),
          ),
        ),

        createPersonal: Effect.fn("Families.createPersonal")(function* (userId: string) {
          const [existing] = yield* database.use((client) =>
            client
              .select({ id: family.id })
              .from(family)
              .where(eq(family.personalForUserId, userId)),
          );

          if (!existing) yield* insert(userId, { name: "Personal", personalForUserId: userId });
        }),

        forgetUser: Effect.fn("Families.forgetUser")(function* (userId: string) {
          const memberships = yield* database.use((client) =>
            client
              .select({
                familyId: familyMember.familyId,
                personalForUserId: family.personalForUserId,
              })
              .from(familyMember)
              .innerJoin(family, eq(family.id, familyMember.familyId))
              .where(eq(familyMember.userId, userId)),
          );

          yield* Effect.forEach(
            memberships,
            ({ familyId, personalForUserId }) =>
              personalForUserId === null
                ? depart(userId, familyId).pipe(Effect.catchTag("NotFound", () => Effect.void))
                : destroy(familyId),
            { discard: true },
          );
        }),
      });
    }),
  );
}
