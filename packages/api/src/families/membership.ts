import type { Database } from "@lardon/db";
import { and, eq } from "@lardon/db/orm";
import { type FamilyRole, familyMember } from "@lardon/db/schema/recipes";

import { forbidden, notFound } from "../errors";

export function memberFamilyIds(db: Database, userId: string) {
  return db
    .select({ id: familyMember.familyId })
    .from(familyMember)
    .where(eq(familyMember.userId, userId));
}

export async function requireMembership(
  db: Database,
  familyId: string,
  userId: string,
  requiredRole: FamilyRole = "member",
): Promise<FamilyRole> {
  const [membership] = await db
    .select({ role: familyMember.role })
    .from(familyMember)
    .where(and(eq(familyMember.familyId, familyId), eq(familyMember.userId, userId)));
  if (!membership) throw notFound("Family");
  if (requiredRole === "owner" && membership.role !== "owner") {
    throw forbidden("Only family owners can do this. Ask an owner of the family.");
  }
  return membership.role;
}
