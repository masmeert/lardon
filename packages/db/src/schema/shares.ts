import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const share = sqliteTable(
  "share",
  {
    token: text("token").primaryKey(),
    recipeId: text("recipe_id").notNull(),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    snapshot: text("snapshot", { mode: "json" }).notNull(),
    imageKey: text("image_key"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index("share_expiresAt_idx").on(table.expiresAt)],
);
