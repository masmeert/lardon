import type { Database } from "@lardon/db";
import { and, desc, eq, inArray, isNotNull, or, sql } from "@lardon/db/orm";
import type { RecipeContent, RecipePatch } from "@lardon/db/recipe-content";
import { type FamilyRole, familyMember, recipe } from "@lardon/db/schema/recipes";

import type { AuthedContext } from "../context";
import { conflict, forbidden, notFound } from "../errors";
import { memberFamilyIds, requireMembership } from "../families/membership";
import { copyImage } from "../images/storage";

const IDS_PER_D1_QUERY = 90;

export type RecipeRow = typeof recipe.$inferSelect;

export function toRecipe(row: RecipeRow) {
  return {
    id: row.id,
    userId: row.userId,
    familyId: row.familyId,
    createdById: row.createdById,
    title: row.title,
    servings: row.servings,
    servingsUnit: row.servingsUnit,
    prepTimeMinutes: row.prepTimeMinutes,
    cookTimeMinutes: row.cookTimeMinutes,
    ingredients: row.ingredients,
    steps: row.steps,
    nutrition: row.nutrition ?? null,
    tags: row.tags,
    notes: row.notes,
    sourceUrl: row.sourceUrl,
    imageKey: row.imageKey,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

export type Recipe = ReturnType<typeof toRecipe>;

function accessibleRecipes(db: Database, userId: string) {
  return or(eq(recipe.userId, userId), inArray(recipe.familyId, memberFamilyIds(db, userId)))!;
}

function nextVersion(previous: Date) {
  return new Date(Math.max(Date.now(), previous.getTime() + 1));
}

export async function loadRecipe(
  db: Database,
  userId: string,
  id: string,
): Promise<{ row: RecipeRow; familyRole: FamilyRole | null }> {
  const [result] = await db
    .select({ row: recipe, familyRole: familyMember.role })
    .from(recipe)
    .leftJoin(
      familyMember,
      and(eq(familyMember.familyId, recipe.familyId), eq(familyMember.userId, userId)),
    )
    .where(and(eq(recipe.id, id), or(eq(recipe.userId, userId), isNotNull(familyMember.userId))));
  if (!result) throw notFound();
  return result;
}

export type ListFilters = {
  familyId?: string | null;
  tag?: string;
  search?: string;
};

export async function listRecipes(context: AuthedContext, filters: ListFilters = {}) {
  const userId = context.session.user.id;
  const conditions = [accessibleRecipes(context.db, userId)];

  if (filters.familyId === null) conditions.push(eq(recipe.userId, userId));
  else if (filters.familyId) conditions.push(eq(recipe.familyId, filters.familyId));

  if (filters.tag) {
    conditions.push(
      sql`exists (select 1 from json_each(${recipe.tags}) where lower(json_each.value) = lower(${filters.tag}))`,
    );
  }

  const search = filters.search?.trim();
  if (search) {
    const pattern = `%${search.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
    conditions.push(
      or(
        sql`${recipe.title} like ${pattern} escape '\\'`,
        sql`exists (select 1 from json_each(${recipe.tags}) as tag where tag.value like ${pattern} escape '\\')`,
        sql`exists (select 1 from json_each(${recipe.ingredients}) as section, json_each(section.value, '$.ingredients') as ingredient where json_extract(ingredient.value, '$.name') like ${pattern} escape '\\')`,
      )!,
    );
  }

  const rows = await context.db
    .select({
      id: recipe.id,
      userId: recipe.userId,
      familyId: recipe.familyId,
      createdById: recipe.createdById,
      title: recipe.title,
      servings: recipe.servings,
      servingsUnit: recipe.servingsUnit,
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      tags: recipe.tags,
      imageKey: recipe.imageKey,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    })
    .from(recipe)
    .where(and(...conditions))
    .orderBy(desc(recipe.updatedAt));

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  }));
}

export async function getRecipe(context: AuthedContext, id: string) {
  const { row } = await loadRecipe(context.db, context.session.user.id, id);
  return toRecipe(row);
}

export async function getRecipes(context: AuthedContext, ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  const results = await Promise.all(
    Array.from({ length: Math.ceil(uniqueIds.length / IDS_PER_D1_QUERY) }, (_, batch) =>
      context.db
        .select()
        .from(recipe)
        .where(
          and(
            inArray(
              recipe.id,
              uniqueIds.slice(batch * IDS_PER_D1_QUERY, (batch + 1) * IDS_PER_D1_QUERY),
            ),
            accessibleRecipes(context.db, context.session.user.id),
          ),
        ),
    ),
  );
  return results.flat().map(toRecipe);
}

export async function recipeManifest(context: AuthedContext) {
  const rows = await context.db
    .select({ id: recipe.id, updatedAt: recipe.updatedAt })
    .from(recipe)
    .where(accessibleRecipes(context.db, context.session.user.id));
  return rows.map((row) => ({ id: row.id, updatedAt: row.updatedAt.getTime() }));
}

export async function createRecipe(
  context: AuthedContext,
  input: RecipeContent & { id?: string; familyId?: string | null },
) {
  const userId = context.session.user.id;
  const { id = crypto.randomUUID(), familyId = null, ...content } = input;
  if (familyId) await requireMembership(context.db, familyId, userId);

  const [row] = await context.db
    .insert(recipe)
    .values({
      ...content,
      id,
      userId: familyId ? null : userId,
      familyId,
      createdById: userId,
    })
    .onConflictDoNothing()
    .returning();
  if (!row) throw conflict("A recipe with this id already exists. Generate a new id and retry.");
  return toRecipe(row);
}

export async function updateRecipe(
  context: AuthedContext,
  id: string,
  patch: RecipePatch,
  baseUpdatedAt?: number,
) {
  const { row } = await loadRecipe(context.db, context.session.user.id, id);
  if (baseUpdatedAt !== undefined && row.updatedAt.getTime() !== baseUpdatedAt) {
    throw conflict("Someone else changed this recipe. Reload it and apply your changes again.");
  }
  if (Object.keys(patch).length === 0) return toRecipe(row);

  const [updated] = await context.db
    .update(recipe)
    .set({ ...patch, updatedAt: nextVersion(row.updatedAt) })
    .where(and(eq(recipe.id, id), eq(recipe.updatedAt, row.updatedAt)))
    .returning();
  if (!updated) {
    throw conflict("Someone else changed this recipe. Reload it and apply your changes again.");
  }
  return toRecipe(updated);
}

export async function deleteRecipe(context: AuthedContext, id: string) {
  const userId = context.session.user.id;
  const { row, familyRole } = await loadRecipe(context.db, userId, id);
  if (row.userId !== userId && row.createdById !== userId && familyRole !== "owner") {
    throw forbidden("Only the author or a family owner can delete this recipe.");
  }
  await context.db.delete(recipe).where(eq(recipe.id, id));
  if (row.imageKey) await context.images.delete([row.imageKey]);
}

export async function moveRecipe(context: AuthedContext, id: string, familyId: string | null) {
  const userId = context.session.user.id;
  const { row } = await loadRecipe(context.db, userId, id);

  if (familyId ? row.familyId === familyId : row.userId === userId) return toRecipe(row);

  if (row.userId !== userId && !(row.familyId !== null && row.createdById === userId)) {
    throw forbidden("Only the author can move this recipe. You can save a copy instead.");
  }
  if (familyId) await requireMembership(context.db, familyId, userId);

  const [updated] = await context.db
    .update(recipe)
    .set({
      userId: familyId ? null : userId,
      familyId,
      updatedAt: nextVersion(row.updatedAt),
    })
    .where(eq(recipe.id, id))
    .returning();
  if (!updated) throw notFound();
  return toRecipe(updated);
}

export async function duplicateRecipe(
  context: AuthedContext,
  id: string,
  familyId: string | null = null,
) {
  const userId = context.session.user.id;
  const { row } = await loadRecipe(context.db, userId, id);
  if (familyId) await requireMembership(context.db, familyId, userId);

  const newRecipeId = crypto.randomUUID();
  const [created] = await context.db
    .insert(recipe)
    .values({
      ...row,
      id: newRecipeId,
      title: (familyId ? row.familyId === familyId : row.userId === userId)
        ? `${row.title} (copy)`
        : row.title,
      userId: familyId ? null : userId,
      familyId,
      createdById: userId,
      imageKey: row.imageKey ? await copyImage(context, row.imageKey, newRecipeId) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return toRecipe(created!);
}

export async function listTags(context: AuthedContext) {
  const rows = await context.db
    .select({ tags: recipe.tags })
    .from(recipe)
    .where(accessibleRecipes(context.db, context.session.user.id));

  const counts = new Map<string, { tag: string; count: number }>();
  for (const { tags } of rows) {
    for (const tag of tags) {
      const entry = counts.get(tag.toLowerCase());
      if (entry) entry.count++;
      else counts.set(tag.toLowerCase(), { tag, count: 1 });
    }
  }
  return [...counts.values()].sort(
    (first, second) => second.count - first.count || first.tag.localeCompare(second.tag),
  );
}

export async function setRecipeImageKey(
  context: AuthedContext,
  id: string,
  imageKey: string | null,
) {
  const { row } = await loadRecipe(context.db, context.session.user.id, id);
  const [updated] = await context.db
    .update(recipe)
    .set({ imageKey, updatedAt: nextVersion(row.updatedAt) })
    .where(eq(recipe.id, id))
    .returning();
  if (!updated) throw notFound();
  return { recipe: toRecipe(updated), previousKey: row.imageKey };
}
