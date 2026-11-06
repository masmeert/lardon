import { recipeContentSchema, recipePatchSchema } from "@lardon/db/recipe-content";
import { z } from "zod";

import { removeRecipeImage } from "../images/upload";
import { protectedProcedure, router } from "../index";
import { exportRecipe, exportSections } from "./export";
import {
  createRecipe,
  deleteRecipe,
  duplicateRecipe,
  getRecipe,
  getRecipes,
  listRecipes,
  listTags,
  moveRecipe,
  recipeManifest,
  updateRecipe,
} from "./service";

const id = z.string().min(1).max(64);

export const recipesRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          familyId: id.nullable().optional(),
          tag: z.string().trim().min(1).max(40).optional(),
          search: z.string().max(100).optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => listRecipes(ctx, input)),

  get: protectedProcedure
    .input(z.object({ id }))
    .query(({ ctx, input }) => getRecipe(ctx, input.id)),

  getMany: protectedProcedure
    .input(z.object({ ids: z.array(id).max(500) }))
    .query(({ ctx, input }) => getRecipes(ctx, input.ids)),

  manifest: protectedProcedure.query(({ ctx }) => recipeManifest(ctx)),

  tags: protectedProcedure.query(({ ctx }) => listTags(ctx)),

  create: protectedProcedure
    .input(recipeContentSchema.extend({ id: z.uuid().optional(), familyId: id.nullish() }))
    .mutation(({ ctx, input }) => createRecipe(ctx, input)),

  update: protectedProcedure
    .input(
      z.object({
        id,
        baseUpdatedAt: z.number().int().optional(),
        patch: recipePatchSchema,
      }),
    )
    .mutation(({ ctx, input }) => updateRecipe(ctx, input.id, input.patch, input.baseUpdatedAt)),

  delete: protectedProcedure.input(z.object({ id })).mutation(async ({ ctx, input }) => {
    await deleteRecipe(ctx, input.id);
    return { id: input.id };
  }),

  move: protectedProcedure
    .input(z.object({ id, familyId: id.nullable() }))
    .mutation(({ ctx, input }) => moveRecipe(ctx, input.id, input.familyId)),

  duplicate: protectedProcedure
    .input(z.object({ id, familyId: id.nullish() }))
    .mutation(({ ctx, input }) => duplicateRecipe(ctx, input.id, input.familyId ?? null)),

  removeImage: protectedProcedure
    .input(z.object({ id }))
    .mutation(({ ctx, input }) => removeRecipeImage(ctx, input.id)),

  export: protectedProcedure
    .input(
      z.object({
        id,
        format: z.enum(["text", "markdown"]),
        include: z.array(z.enum(exportSections)).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const file = await exportRecipe(ctx, input.id, input.format, input.include);
      return { filename: file.filename, content: file.body as string };
    }),
});
