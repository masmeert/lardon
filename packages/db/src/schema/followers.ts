import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";
import { family } from "./families";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

const userReference = () => user.id;

export const profile = sqliteTable("profile", {
  userId: text("user_id").primaryKey().references(userReference, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  bio: text("bio"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

const followStatuses = ["pending", "approved"] as const;

export type FollowStatus = (typeof followStatuses)[number];

export const follow = sqliteTable(
  "follow",
  {
    followerId: text("follower_id").notNull().references(userReference, { onDelete: "cascade" }),
    followeeId: text("followee_id").notNull().references(userReference, { onDelete: "cascade" }),
    status: text("status", { enum: followStatuses }).notNull().default("pending"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followeeId] }),
    index("follow_followeeId_status_idx").on(table.followeeId, table.status),
  ],
);

export const block = sqliteTable(
  "block",
  {
    blockerId: text("blocker_id").notNull().references(userReference, { onDelete: "cascade" }),
    blockedId: text("blocked_id").notNull().references(userReference, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.blockerId, table.blockedId] }),
    index("block_blockedId_idx").on(table.blockedId),
  ],
);

export const publishedRecipe = sqliteTable(
  "published_recipe",
  {
    recipeId: text("recipe_id").primaryKey(),
    familyId: text("family_id")
      .notNull()
      .references(() => family.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull().references(userReference, { onDelete: "cascade" }),
    snapshot: text("snapshot", { mode: "json" }).notNull(),
    imageKey: text("image_key"),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    index("published_recipe_authorId_publishedAt_idx").on(table.authorId, table.publishedAt),
    index("published_recipe_familyId_idx").on(table.familyId),
  ],
);
