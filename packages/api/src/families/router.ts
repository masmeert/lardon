import { familyRoles } from "@lardon/db/schema/recipes";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import {
  createFamily,
  createInvite,
  deleteFamily,
  getFamily,
  joinFamily,
  leaveFamily,
  listFamilies,
  removeMember,
  renameFamily,
  revokeInvite,
  setMemberRole,
} from "./service";

const id = z.string().min(1).max(64);
const name = z.string().trim().min(1).max(80);
const code = z.string().trim().min(1).max(32);

export const familiesRouter = router({
  list: protectedProcedure.query(({ ctx }) => listFamilies(ctx)),

  get: protectedProcedure
    .input(z.object({ id }))
    .query(({ ctx, input }) => getFamily(ctx, input.id)),

  create: protectedProcedure
    .input(z.object({ name }))
    .mutation(({ ctx, input }) => createFamily(ctx, input.name)),

  rename: protectedProcedure
    .input(z.object({ id, name }))
    .mutation(({ ctx, input }) => renameFamily(ctx, input.id, input.name)),

  delete: protectedProcedure.input(z.object({ id })).mutation(async ({ ctx, input }) => {
    await deleteFamily(ctx, input.id);
    return { id: input.id };
  }),

  createInvite: protectedProcedure
    .input(z.object({ familyId: id }))
    .mutation(({ ctx, input }) => createInvite(ctx, input.familyId)),

  revokeInvite: protectedProcedure.input(z.object({ code })).mutation(async ({ ctx, input }) => {
    await revokeInvite(ctx, input.code);
    return { code: input.code };
  }),

  join: protectedProcedure
    .input(z.object({ code }))
    .mutation(({ ctx, input }) => joinFamily(ctx, input.code)),

  leave: protectedProcedure.input(z.object({ familyId: id })).mutation(async ({ ctx, input }) => {
    await leaveFamily(ctx, input.familyId);
    return { familyId: input.familyId };
  }),

  removeMember: protectedProcedure
    .input(z.object({ familyId: id, userId: id }))
    .mutation(({ ctx, input }) => removeMember(ctx, input.familyId, input.userId)),

  setMemberRole: protectedProcedure
    .input(z.object({ familyId: id, userId: id, role: z.enum(familyRoles) }))
    .mutation(({ ctx, input }) => setMemberRole(ctx, input.familyId, input.userId, input.role)),
});
