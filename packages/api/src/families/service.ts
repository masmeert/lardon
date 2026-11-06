import { and, asc, eq, gt, isNotNull, isNull, ne, sql } from "@lardon/db/orm";
import { user } from "@lardon/db/schema/auth";
import {
  type FamilyRole,
  family,
  familyInvite,
  familyMember,
  recipe,
} from "@lardon/db/schema/recipes";

import type { AuthedContext, Context } from "../context";
import { badRequest, forbidden, notFound } from "../errors";
import { formatInviteCode, generateInviteCode, normalizeInviteCode } from "./invite-code";
import { requireMembership } from "./membership";

const joinOrder = [asc(familyMember.joinedAt), asc(sql`${familyMember}.rowid`)];

export async function listFamilies(context: AuthedContext) {
  const rows = await context.db
    .select({
      id: family.id,
      name: family.name,
      role: familyMember.role,
      memberCount: sql<number>`(select count(*) from ${familyMember} as member where member.family_id = ${family.id})`,
      createdAt: family.createdAt,
    })
    .from(familyMember)
    .innerJoin(family, eq(family.id, familyMember.familyId))
    .where(eq(familyMember.userId, context.session.user.id))
    .orderBy(asc(family.name));
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.getTime() }));
}

export async function getFamily(context: AuthedContext, familyId: string) {
  const role = await requireMembership(context.db, familyId, context.session.user.id);
  const [row] = await context.db.select().from(family).where(eq(family.id, familyId));
  if (!row) throw notFound("Family");

  const [members, invites] = await Promise.all([
    context.db
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
    context.db
      .select()
      .from(familyInvite)
      .where(and(eq(familyInvite.familyId, familyId), gt(familyInvite.expiresAt, new Date())))
      .orderBy(asc(familyInvite.expiresAt)),
  ]);

  return {
    id: row.id,
    name: row.name,
    role,
    createdAt: row.createdAt.getTime(),
    members: members.map((member) => ({ ...member, joinedAt: member.joinedAt.getTime() })),
    invites: invites.map((invite) => ({
      code: formatInviteCode(invite.code),
      createdById: invite.createdById,
      expiresAt: invite.expiresAt.getTime(),
    })),
  };
}

export async function createFamily(context: AuthedContext, name: string) {
  const id = crypto.randomUUID();
  await context.db.batch([
    context.db.insert(family).values({ id, name }),
    context.db
      .insert(familyMember)
      .values({ familyId: id, userId: context.session.user.id, role: "owner" }),
  ]);
  return getFamily(context, id);
}

export async function renameFamily(context: AuthedContext, familyId: string, name: string) {
  await requireMembership(context.db, familyId, context.session.user.id, "owner");
  await context.db.update(family).set({ name }).where(eq(family.id, familyId));
  return getFamily(context, familyId);
}

async function destroyFamily(context: Pick<Context, "db" | "images">, familyId: string) {
  const orphaned = await context.db
    .select({ imageKey: recipe.imageKey })
    .from(recipe)
    .where(
      and(eq(recipe.familyId, familyId), isNull(recipe.createdById), isNotNull(recipe.imageKey)),
    );

  await context.db.batch([
    context.db
      .update(recipe)
      .set({ userId: sql`${recipe.createdById}`, familyId: null, updatedAt: new Date() })
      .where(and(eq(recipe.familyId, familyId), isNotNull(recipe.createdById))),
    context.db.delete(family).where(eq(family.id, familyId)),
  ]);

  const keys = orphaned.flatMap((row) => (row.imageKey ? [row.imageKey] : []));
  if (keys.length > 0) await context.images.delete(keys);
}

export async function deleteFamily(context: AuthedContext, familyId: string) {
  await requireMembership(context.db, familyId, context.session.user.id, "owner");
  await destroyFamily(context, familyId);
}

export async function createInvite(context: AuthedContext, familyId: string) {
  await requireMembership(context.db, familyId, context.session.user.id);
  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await context.db
    .insert(familyInvite)
    .values({ code, familyId, createdById: context.session.user.id, expiresAt });
  return { code: formatInviteCode(code), expiresAt: expiresAt.getTime() };
}

export async function revokeInvite(context: AuthedContext, rawCode: string) {
  const code = normalizeInviteCode(rawCode);
  const [invite] = await context.db.select().from(familyInvite).where(eq(familyInvite.code, code));
  if (!invite) throw notFound("Invite");
  const role = await requireMembership(context.db, invite.familyId, context.session.user.id);
  if (role !== "owner" && invite.createdById !== context.session.user.id) {
    throw forbidden("Only the person who created this invite or a family owner can revoke it.");
  }
  await context.db.delete(familyInvite).where(eq(familyInvite.code, code));
}

export async function joinFamily(context: AuthedContext, rawCode: string) {
  const [invite] = await context.db
    .select()
    .from(familyInvite)
    .where(
      and(
        eq(familyInvite.code, normalizeInviteCode(rawCode)),
        gt(familyInvite.expiresAt, new Date()),
      ),
    );
  if (!invite) throw notFound("Invite");

  await context.db
    .insert(familyMember)
    .values({ familyId: invite.familyId, userId: context.session.user.id, role: "member" })
    .onConflictDoNothing();
  return getFamily(context, invite.familyId);
}

export async function leaveFamily(context: AuthedContext, familyId: string) {
  const userId = context.session.user.id;
  const role = await requireMembership(context.db, familyId, userId);
  const otherMembers = await context.db
    .select({ userId: familyMember.userId, role: familyMember.role })
    .from(familyMember)
    .where(and(eq(familyMember.familyId, familyId), ne(familyMember.userId, userId)))
    .orderBy(...joinOrder);

  const [successor] = otherMembers;
  if (!successor) {
    await destroyFamily(context, familyId);
    return;
  }

  const removeSelf = context.db
    .delete(familyMember)
    .where(and(eq(familyMember.familyId, familyId), eq(familyMember.userId, userId)));

  if (role === "owner" && !otherMembers.some((member) => member.role === "owner")) {
    await context.db.batch([
      context.db
        .update(familyMember)
        .set({ role: "owner" })
        .where(and(eq(familyMember.familyId, familyId), eq(familyMember.userId, successor.userId))),
      removeSelf,
    ]);
  } else {
    await removeSelf;
  }
}

export async function removeMember(context: AuthedContext, familyId: string, memberId: string) {
  if (memberId === context.session.user.id) {
    throw badRequest("You can't remove yourself. Leave the family instead.");
  }
  await requireMembership(context.db, familyId, context.session.user.id, "owner");

  const [removed] = await context.db
    .delete(familyMember)
    .where(and(eq(familyMember.familyId, familyId), eq(familyMember.userId, memberId)))
    .returning();
  if (!removed) throw notFound("Member");
  return getFamily(context, familyId);
}

export async function setMemberRole(
  context: AuthedContext,
  familyId: string,
  memberId: string,
  role: FamilyRole,
) {
  await requireMembership(context.db, familyId, context.session.user.id, "owner");

  if (role === "member") {
    const owners = await context.db
      .select({ userId: familyMember.userId })
      .from(familyMember)
      .where(and(eq(familyMember.familyId, familyId), eq(familyMember.role, "owner")));
    if (owners.length === 1 && owners[0]?.userId === memberId) {
      throw badRequest("A family needs at least one owner. Make someone else an owner first.");
    }
  }

  const [updated] = await context.db
    .update(familyMember)
    .set({ role })
    .where(and(eq(familyMember.familyId, familyId), eq(familyMember.userId, memberId)))
    .returning();
  if (!updated) throw notFound("Member");
  return getFamily(context, familyId);
}
