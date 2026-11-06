import { Schema } from "@livestore/livestore";

export const RecipeSyncPayload = Schema.Struct({
  sessionCookie: Schema.String.check(Schema.isMaxLength(4096)),
});

export type RecipeSyncPayload = typeof RecipeSyncPayload.Type;
