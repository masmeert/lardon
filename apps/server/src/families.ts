import {
  type FamilyDetails,
  type FamilyInvite,
  type FamilyRole,
  type FamilySummary,
  Forbidden,
  InvalidRequest,
  NotFound,
} from "@lardon/api";
import { and, asc, eq, gt, ne, sql } from "@lardon/db/orm";
import { user } from "@lardon/db/schema/auth";
import { family, familyInvite, familyMember } from "@lardon/db/schema/families";
import { familyStoreId, parseStoreId } from "@lardon/recipes/store-id";
import { Clock, Context, Effect, Layer } from "effect";

import { Database } from "./database";
import { ImageStorage } from "./image-storage";
import { formatInviteCode, generateInviteCode, normalizeInviteCode } from "./invite-code";
import { RecipeStoreBackend } from "./recipe-store-backend";

const INVITE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const joinOrder = [asc(familyMember.joinedAt), asc(sql`${familyMember}.rowid`)];

export class Families extends Context.Service<
  Families,
  {
    list(userId: string): Effect.Effect<FamilySummary[]>;
    get(userId: string, familyId: string): Effect.Effect<FamilyDetails, NotFound>;
    create(userId: string, name: string): Effect.Effect<FamilyDetails>;
    rename(
      userId: string,
      familyId: string,
      name: string,
    ): Effect.Effect<FamilyDetails, NotFound | Forbidden>;
    delete(userId: string, familyId: string): Effect.Effect<void, NotFound | Forbidden>;
    createInvite(userId: string, familyId: string): Effect.Effect<FamilyInvite, NotFound>;
    revokeInvite(userId: string, code: string): Effect.Effect<void, NotFound | Forbidden>;
    join(userId: string, code: string): Effect.Effect<FamilyDetails, NotFound>;
    leave(userId: string, familyId: string): Effect.Effect<void, NotFound>;
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
    canAccessRecipeStore(userId: string, storeId: string): Effect.Effect<boolean>;
  }
>()("lardon/server/Families") {
  static readonly layer = Layer.effect(
    Families,
    Effect.gen(function* () {
      const database = yield* Database;
      const recipeStores = yield* RecipeStoreBackend;
      const images = yield* ImageStorage;

      const requireMember = Effect.fn("Families.requireMember")(function* (
        familyId: string,
        userId: string,
      ) {
        const [membership] = yield* database.use((client) =>
          client
            .select({ role: familyMember.role })
            .from(familyMember)
            .where(and(eq(familyMember.familyId, familyId), eq(familyMember.userId, userId))),
        );
        if (!membership) return yield* new NotFound({ message: "This family doesn't exist." });
        return membership.role;
      });

      const requireOwner = Effect.fn("Families.requireOwner")(function* (
        familyId: string,
        userId: string,
      ) {
        if ((yield* requireMember(familyId, userId)) !== "owner") {
          return yield* new Forbidden({
            message: "Only family owners can do this. Ask an owner of the family.",
          });
        }
      });

      const get = Effect.fn("Families.get")(function* (userId: string, familyId: string) {
        const role = yield* requireMember(familyId, userId);
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
        if (!row) return yield* new NotFound({ message: "This family doesn't exist." });
        return {
          id: row.id,
          name: row.name,
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

      const destroy = Effect.fn("Families.destroy")(function* (familyId: string) {
        yield* database.use((client) => client.delete(family).where(eq(family.id, familyId)));
        yield* recipeStores.deleteStore(familyStoreId(familyId));
        yield* images.deleteAll(`${familyStoreId(familyId)}/`);
      });

      return Families.of({
        list: Effect.fn("Families.list")((userId: string) =>
          database.use((client) =>
            client
              .select({
                id: family.id,
                name: family.name,
                role: familyMember.role,
                memberCount: sql<number>`(select count(*) from ${familyMember} as member where member.family_id = ${family.id})`,
                createdAt: family.createdAt,
              })
              .from(familyMember)
              .innerJoin(family, eq(family.id, familyMember.familyId))
              .where(eq(familyMember.userId, userId))
              .orderBy(asc(family.name)),
          ),
        ),

        get,

        create: Effect.fn("Families.create")(function* (userId: string, name: string) {
          const familyId = crypto.randomUUID();
          yield* database.use((client) =>
            client.batch([
              client.insert(family).values({ id: familyId, name }),
              client.insert(familyMember).values({ familyId, userId, role: "owner" }),
            ]),
          );
          return yield* get(userId, familyId).pipe(Effect.orDie);
        }),

        rename: Effect.fn("Families.rename")(function* (
          userId: string,
          familyId: string,
          name: string,
        ) {
          yield* requireOwner(familyId, userId);
          yield* database.use((client) =>
            client.update(family).set({ name }).where(eq(family.id, familyId)),
          );
          return yield* get(userId, familyId);
        }),

        delete: Effect.fn("Families.delete")(function* (userId: string, familyId: string) {
          yield* requireOwner(familyId, userId);
          yield* destroy(familyId);
        }),

        createInvite: Effect.fn("Families.createInvite")(function* (
          userId: string,
          familyId: string,
        ) {
          yield* requireMember(familyId, userId);
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
          const role = yield* requireMember(invite.familyId, userId);
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
          yield* database.use((client) =>
            client
              .insert(familyMember)
              .values({ familyId: invite.familyId, userId, role: "member" })
              .onConflictDoNothing(),
          );
          return yield* get(userId, invite.familyId);
        }),

        leave: Effect.fn("Families.leave")(function* (userId: string, familyId: string) {
          const role = yield* requireMember(familyId, userId);
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
                  .where(
                    and(
                      eq(familyMember.familyId, familyId),
                      eq(familyMember.userId, successor.userId),
                    ),
                  ),
                client
                  .delete(familyMember)
                  .where(and(eq(familyMember.familyId, familyId), eq(familyMember.userId, userId))),
              ]),
            );
          } else {
            yield* database.use((client) =>
              client
                .delete(familyMember)
                .where(and(eq(familyMember.familyId, familyId), eq(familyMember.userId, userId))),
            );
          }
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
          const [removed] = yield* database.use((client) =>
            client
              .delete(familyMember)
              .where(and(eq(familyMember.familyId, familyId), eq(familyMember.userId, memberId)))
              .returning(),
          );
          if (!removed) {
            return yield* new NotFound({ message: "This person isn't a member of the family." });
          }
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
              .where(and(eq(familyMember.familyId, familyId), eq(familyMember.userId, memberId)))
              .returning(),
          );
          if (!updated) {
            return yield* new NotFound({ message: "This person isn't a member of the family." });
          }
          return yield* get(userId, familyId);
        }),

        canAccessRecipeStore: Effect.fn("Families.canAccessRecipeStore")(function* (
          userId: string,
          storeId: string,
        ) {
          const owner = parseStoreId(storeId);
          if (!owner) return false;
          if (owner.kind === "user") return owner.userId === userId;
          const [membership] = yield* database.use((client) =>
            client
              .select({ familyId: familyMember.familyId })
              .from(familyMember)
              .where(
                and(eq(familyMember.familyId, owner.familyId), eq(familyMember.userId, userId)),
              ),
          );
          return membership !== undefined;
        }),
      });
    }),
  );
}
