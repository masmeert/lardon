import { recipeDetail } from "@lardon/recipes";
import { RecipeSnapshot, recipeSnapshot } from "@lardon/recipes/snapshot";
import { readRows } from "@lardon/recipes/tables";
import { and, eq, sql } from "@lardon/db/orm";
import { familyMember } from "@lardon/db/schema/families";
import { publishedRecipe } from "@lardon/db/schema/followers";
import { Clock, Effect, Option, Schema } from "effect";
import type { Tables } from "tinybase";

import { Database } from "./database";

export const PUBLISH_DELAY_MS = 5000;

export type Publication = {
  recipeId: string;
  authorId: string;
  recipe: RecipeSnapshot;
  imageKey: string | null;
};

const decodeSnapshot = Schema.decodeUnknownOption(RecipeSnapshot);

const isSameSnapshot = Schema.toEquivalence(RecipeSnapshot);

export function familyPublications(content: Tables): Publication[] {
  return readRows(content, "recipes").flatMap((recipe) => {
    const detail = recipe.visibility === "followers" ? recipeDetail(content, recipe.id) : undefined;

    return detail
      ? [
          {
            recipeId: recipe.id,
            authorId: recipe.createdById,
            recipe: recipeSnapshot(detail),
            imageKey: recipe.imageKey ?? null,
          },
        ]
      : [];
  });
}

export const reconcilePublications = Effect.fn("reconcilePublications")(function* (
  familyId: string,
  publications: readonly Publication[],
) {
  const database = yield* Database;
  const now = new Date(yield* Clock.currentTimeMillis);

  const [members, existing] = yield* database.use((client) =>
    Promise.all([
      client
        .select({ userId: familyMember.userId })
        .from(familyMember)
        .where(eq(familyMember.familyId, familyId)),
      client.select().from(publishedRecipe).where(eq(publishedRecipe.familyId, familyId)),
    ]),
  );

  const memberIds = new Set(members.map((member) => member.userId));

  const wanted = new Map(
    publications.flatMap((publication) =>
      memberIds.has(publication.authorId) ? [[publication.recipeId, publication] as const] : [],
    ),
  );

  const removed = existing.filter((row) => !wanted.has(row.recipeId));

  const changed = [...wanted.values()].filter((publication) => {
    const row = existing.find((candidate) => candidate.recipeId === publication.recipeId);

    return (
      !row ||
      row.authorId !== publication.authorId ||
      row.imageKey !== publication.imageKey ||
      !Option.exists(decodeSnapshot(row.snapshot), (snapshot) =>
        isSameSnapshot(snapshot, publication.recipe),
      )
    );
  });

  const { client } = database;

  const [first, ...rest] = [
    ...removed.map((row) =>
      client
        .delete(publishedRecipe)
        .where(
          and(eq(publishedRecipe.recipeId, row.recipeId), eq(publishedRecipe.familyId, familyId)),
        ),
    ),
    ...changed.map((publication) =>
      client
        .insert(publishedRecipe)
        .values({
          recipeId: publication.recipeId,
          familyId,
          authorId: publication.authorId,
          snapshot: publication.recipe,
          imageKey: publication.imageKey,
          publishedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: publishedRecipe.recipeId,
          set: {
            familyId,
            snapshot: publication.recipe,
            imageKey: publication.imageKey,
            updatedAt: now,
          },
          setWhere: sql`${publishedRecipe.authorId} = excluded.author_id`,
        }),
    ),
  ];

  if (first) yield* database.use(() => client.batch([first, ...rest]));

  return wanted.size;
});
