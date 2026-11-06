import { recipeEvents } from "@lardon/recipes/events";
import { Option, Schema } from "effect";

export type EventlogSql = {
  exec(
    query: string,
    ...bindings: Array<string | number | null>
  ): { toArray(): ReadonlyArray<object> };
};

const RecipeReference = Schema.Struct({ recipeId: Schema.String });

function recordDeletedRecipes(sql: EventlogSql, recipeIds: readonly string[]) {
  sql.exec("CREATE TABLE IF NOT EXISTS deleted_recipes (recipe_id TEXT PRIMARY KEY) STRICT");
  sql.exec(
    "INSERT OR IGNORE INTO deleted_recipes (recipe_id) SELECT value FROM json_each(?)",
    JSON.stringify(recipeIds),
  );
}

export function trackRecipeEvents(
  sql: EventlogSql,
  batch: ReadonlyArray<{ name: string; args: object | null | undefined }>,
) {
  const references = batch.flatMap((event) =>
    Option.match(Schema.decodeUnknownOption(RecipeReference)(event.args), {
      onNone: () => [],
      onSome: ({ recipeId }) => [{ name: event.name, recipeId }],
    }),
  );

  recordDeletedRecipes(
    sql,
    references.flatMap((reference) =>
      reference.name === recipeEvents.recipeDeleted.name ? [reference.recipeId] : [],
    ),
  );

  return (
    references.some(
      (reference) =>
        reference.name === recipeEvents.recipeDeleted.name ||
        reference.name === recipeEvents.recipeImageSet.name,
    ) ||
    sql
      .exec(
        "SELECT 1 FROM deleted_recipes WHERE recipe_id IN (SELECT value FROM json_each(?)) LIMIT 1",
        JSON.stringify(references.map((reference) => reference.recipeId)),
      )
      .toArray().length > 0
  );
}

export function staleImageKeys(sql: EventlogSql, eventlogTable: string, storeId: string) {
  const events = Schema.decodeUnknownSync(
    Schema.Array(
      Schema.Struct({
        name: Schema.String,
        recipeId: Schema.String,
        imageKey: Schema.NullOr(Schema.String),
      }),
    ),
  )(
    sql
      .exec(
        `SELECT name, json_extract(args, '$.recipeId') AS recipeId, json_extract(args, '$.imageKey') AS imageKey
         FROM "${eventlogTable}" WHERE name IN (?, ?, ?) ORDER BY seqNum`,
        recipeEvents.recipeCreated.name,
        recipeEvents.recipeImageSet.name,
        recipeEvents.recipeDeleted.name,
      )
      .toArray(),
  );

  const deletedRecipeIds = new Set(
    events.flatMap((event) =>
      event.name === recipeEvents.recipeDeleted.name ? [event.recipeId] : [],
    ),
  );

  const keptImageKeys = new Set(
    new Map(
      events.flatMap((event) =>
        event.name === recipeEvents.recipeDeleted.name || deletedRecipeIds.has(event.recipeId)
          ? []
          : [[event.recipeId, event.imageKey] as const],
      ),
    ).values(),
  );

  return [...new Set(events.map((event) => event.imageKey))].flatMap((imageKey) =>
    imageKey?.startsWith(`${storeId}/`) && !keptImageKeys.has(imageKey) ? [imageKey] : [],
  );
}

export function eraseDeletedRecipes(sql: EventlogSql, eventlogTable: string) {
  const erased = Schema.decodeUnknownSync(Schema.Array(RecipeReference))(
    sql
      .exec(
        `UPDATE "${eventlogTable}"
         SET name = ?, args = json_object('recipeId', json_extract(args, '$.recipeId'))
         WHERE name IN (SELECT value FROM json_each(?))
           AND json_extract(args, '$.recipeId') IN (
             SELECT json_extract(args, '$.recipeId') FROM "${eventlogTable}" WHERE name = ?
           )
         RETURNING json_extract(args, '$.recipeId') AS recipeId`,
        recipeEvents.recipeErased.name,
        JSON.stringify(
          Object.values(recipeEvents).flatMap(({ name }) =>
            name === recipeEvents.recipeDeleted.name || name === recipeEvents.recipeErased.name
              ? []
              : [name],
          ),
        ),
        recipeEvents.recipeDeleted.name,
      )
      .toArray(),
  );

  const recipeIds = [...new Set(erased.map(({ recipeId }) => recipeId))];
  recordDeletedRecipes(sql, recipeIds);

  return recipeIds;
}
