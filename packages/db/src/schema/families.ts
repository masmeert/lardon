import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
};

export const family = sqliteTable("family", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ...timestamps,
});

export const familyRoles = ["owner", "member"] as const;
export type FamilyRole = (typeof familyRoles)[number];

export const familyMember = sqliteTable(
  "family_member",
  {
    familyId: text("family_id")
      .notNull()
      .references(() => family.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: familyRoles }).notNull().default("member"),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.familyId, table.userId] }),
    index("family_member_userId_idx").on(table.userId),
  ],
);

export const familyInvite = sqliteTable(
  "family_invite",
  {
    code: text("code").primaryKey(),
    familyId: text("family_id")
      .notNull()
      .references(() => family.id, { onDelete: "cascade" }),
    createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: timestamps.createdAt,
  },
  (table) => [index("family_invite_familyId_idx").on(table.familyId)],
);
