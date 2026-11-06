import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import type { IngredientSection, Nutrition, StepSection } from "../recipe-content";
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

export const recipe = sqliteTable(
  "recipe",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    familyId: text("family_id").references(() => family.id, { onDelete: "cascade" }),
    createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),

    title: text("title").notNull(),
    servings: real("servings"),
    servingsUnit: text("servings_unit"),
    prepTimeMinutes: integer("prep_time_minutes"),
    cookTimeMinutes: integer("cook_time_minutes"),
    ingredients: text("ingredients", { mode: "json" })
      .$type<IngredientSection[]>()
      .notNull()
      .default(sql`'[]'`),
    steps: text("steps", { mode: "json" })
      .$type<StepSection[]>()
      .notNull()
      .default(sql`'[]'`),
    nutrition: text("nutrition", { mode: "json" }).$type<Nutrition>(),
    tags: text("tags", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    notes: text("notes"),
    sourceUrl: text("source_url"),
    imageKey: text("image_key"),

    ...timestamps,
  },
  (table) => [
    index("recipe_userId_idx").on(table.userId),
    index("recipe_familyId_idx").on(table.familyId),
    check("recipe_single_owner", sql`(${table.userId} IS NULL) <> (${table.familyId} IS NULL)`),
  ],
);
