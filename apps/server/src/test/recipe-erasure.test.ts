import { DatabaseSync } from "node:sqlite";

import { recipeEvents } from "@lardon/recipes/events";
import { recipes$ } from "@lardon/recipes/queries";
import { recipeSchema } from "@lardon/recipes/schema";
import { createTestStore } from "@lardon/recipes/test/store";
import { Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";

import {
  type EventlogSql,
  eraseDeletedRecipes,
  staleImageKeys,
  trackRecipeEvents,
} from "../recipe-erasure";

const STORE_ID = "family-cooks";
const EVENTLOG = "eventlog_7_family_cooks";
const now = new Date("2026-11-06T12:00:00Z");

function createEventlog() {
  const database = new DatabaseSync(":memory:");
  database.exec(
    `CREATE TABLE "${EVENTLOG}" (seqNum INTEGER PRIMARY KEY, parentSeqNum INTEGER NOT NULL, name TEXT NOT NULL, args TEXT, createdAt TEXT NOT NULL, clientId TEXT NOT NULL, sessionId TEXT NOT NULL) STRICT`,
  );

  const sql: EventlogSql = {
    exec(query, ...bindings) {
      const rows = database.prepare(query).all(...bindings);

      return { toArray: () => rows };
    },
  };

  function append(...events: ReadonlyArray<{ name: string; args: object }>) {
    for (const event of events) {
      const parentSeqNum = Number(
        database.prepare(`SELECT COUNT(*) AS total FROM "${EVENTLOG}"`).get()?.total,
      );

      database
        .prepare(`INSERT INTO "${EVENTLOG}" VALUES (?, ?, ?, ?, ?, 'client', 'session')`)
        .run(
          parentSeqNum + 1,
          parentSeqNum,
          event.name,
          JSON.stringify(
            Schema.encodeUnknownSync(recipeSchema.eventsDefsMap.get(event.name)!.schema)(
              event.args,
            ),
          ),
          now.toISOString(),
        );
    }

    return events;
  }

  function rows() {
    return Schema.decodeUnknownSync(
      Schema.Array(
        Schema.Struct({
          seqNum: Schema.Number,
          parentSeqNum: Schema.Number,
          name: Schema.String,
          args: Schema.String,
        }),
      ),
    )(
      database
        .prepare(`SELECT seqNum, parentSeqNum, name, args FROM "${EVENTLOG}" ORDER BY seqNum`)
        .all(),
    );
  }

  return { sql, append, rows };
}

function recipeCreated(recipeId: string, title: string, imageKey: string | null) {
  return recipeEvents.recipeCreated({
    recipeId,
    title,
    servings: null,
    servingsUnit: null,
    prepTimeMinutes: null,
    cookTimeMinutes: null,
    notes: `${title} notes`,
    sourceUrl: null,
    imageKey,
    nutrition: null,
    tags: [],
    ingredientSections: [
      {
        sectionId: `${recipeId}-ingredients`,
        position: "a0",
        title: null,
        ingredients: [
          {
            ingredientId: `${recipeId}-flour`,
            position: "a0",
            quantity: 200,
            unit: "g",
            name: "flour",
            note: null,
          },
        ],
      },
    ],
    stepSections: [
      {
        sectionId: `${recipeId}-steps`,
        position: "a0",
        title: null,
        steps: [{ stepId: `${recipeId}-mix`, position: "a0", text: "Mix." }],
      },
    ],
    createdById: "alice",
    createdAt: now,
  });
}

describe("recipe erasure", () => {
  it("erases a deleted recipe's events and photos so a fresh device never sees it", async () => {
    const eventlog = createEventlog();

    eventlog.append(
      recipeCreated("soup", "Soup", `${STORE_ID}/soup-1.jpg`),
      recipeCreated("pie", "Grandma's pie", `${STORE_ID}/pie-1.jpg`),
      recipeEvents.stepAdded({
        recipeId: "pie",
        sectionId: "pie-steps",
        stepId: "pie-glaze",
        position: "a1",
        text: "Brush with the secret glaze.",
        updatedAt: now,
      }),
      recipeEvents.recipeImageSet({
        recipeId: "pie",
        imageKey: `${STORE_ID}/pie-2.jpg`,
        updatedAt: now,
      }),
      recipeEvents.recipeImageSet({
        recipeId: "soup",
        imageKey: `${STORE_ID}/soup-2.jpg`,
        updatedAt: now,
      }),
      recipeEvents.recipeDeleted({ recipeId: "pie", deletedAt: now }),
    );

    const before = eventlog.rows();

    expect(staleImageKeys(eventlog.sql, EVENTLOG, STORE_ID).toSorted()).toEqual([
      `${STORE_ID}/pie-1.jpg`,
      `${STORE_ID}/pie-2.jpg`,
      `${STORE_ID}/soup-1.jpg`,
    ]);
    expect(eraseDeletedRecipes(eventlog.sql, EVENTLOG)).toEqual(["pie"]);

    const after = eventlog.rows();

    expect(after.map(({ seqNum, parentSeqNum }) => [seqNum, parentSeqNum])).toEqual(
      before.map(({ seqNum, parentSeqNum }) => [seqNum, parentSeqNum]),
    );
    expect(after.map(({ name }) => name)).toEqual([
      "v1.RecipeCreated",
      "v1.RecipeErased",
      "v1.RecipeErased",
      "v1.RecipeErased",
      "v1.RecipeImageSet",
      "v1.RecipeDeleted",
    ]);
    expect(after.slice(1, 4).map(({ args }) => JSON.parse(args))).toEqual([
      { recipeId: "pie" },
      { recipeId: "pie" },
      { recipeId: "pie" },
    ]);
    expect(after.filter(({ args }) => args.includes("soup"))).toEqual(
      before.filter(({ args }) => args.includes("soup")),
    );
    expect(after.some(({ args }) => /Grandma|glaze|pie-\d/.test(args))).toBe(false);
    expect(staleImageKeys(eventlog.sql, EVENTLOG, STORE_ID)).toEqual([`${STORE_ID}/soup-1.jpg`]);

    const store = await createTestStore();

    for (const { name, args } of after) {
      // SAFETY: the args were just decoded with the schema of the event called `name`.
      store.commit({
        name,
        args: Schema.decodeUnknownSync(recipeSchema.eventsDefsMap.get(name)!.schema)(
          JSON.parse(args),
        ),
      } as ReturnType<(typeof recipeEvents)[keyof typeof recipeEvents]>);
    }

    expect(store.query(recipes$).map(({ id, imageKey }) => ({ id, imageKey }))).toEqual([
      { id: "soup", imageKey: `${STORE_ID}/soup-2.jpg` },
    ]);
  });

  it("erases edits that reach the server after the recipe was erased", () => {
    const eventlog = createEventlog();

    eventlog.append(
      recipeCreated("pie", "Pie", null),
      recipeEvents.recipeDeleted({ recipeId: "pie", deletedAt: now }),
    );
    eraseDeletedRecipes(eventlog.sql, EVENTLOG);

    const lateEdit = eventlog.append(
      recipeEvents.ingredientAdded({
        recipeId: "pie",
        sectionId: "pie-ingredients",
        ingredientId: "pie-butter",
        position: "a1",
        quantity: 100,
        unit: "g",
        name: "salted butter",
        note: null,
        updatedAt: now,
      }),
      recipeEvents.recipeImageSet({
        recipeId: "pie",
        imageKey: `${STORE_ID}/pie-late.jpg`,
        updatedAt: now,
      }),
    );

    expect(trackRecipeEvents(eventlog.sql, lateEdit.slice(0, 1))).toBe(true);
    expect(staleImageKeys(eventlog.sql, EVENTLOG, STORE_ID)).toEqual([`${STORE_ID}/pie-late.jpg`]);
    expect(eraseDeletedRecipes(eventlog.sql, EVENTLOG)).toEqual(["pie"]);
    expect(eventlog.rows().some(({ args }) => args.includes("butter"))).toBe(false);
    expect(eraseDeletedRecipes(eventlog.sql, EVENTLOG)).toEqual([]);
  });

  it("only asks for an erasure when a push deletes, changes a photo or touches a deleted recipe", () => {
    const { sql } = createEventlog();

    const edit = recipeEvents.recipeDetailsUpdated({
      recipeId: "soup",
      title: "Tomato soup",
      updatedAt: now,
    });

    expect(trackRecipeEvents(sql, [edit])).toBe(false);
    expect(
      trackRecipeEvents(sql, [
        recipeEvents.recipeImageSet({ recipeId: "soup", imageKey: null, updatedAt: now }),
      ]),
    ).toBe(true);
    expect(
      trackRecipeEvents(sql, [recipeEvents.recipeDeleted({ recipeId: "soup", deletedAt: now })]),
    ).toBe(true);
    expect(trackRecipeEvents(sql, [edit])).toBe(true);
  });

  it("keeps photos still shown by another recipe and never touches other stores' photos", () => {
    const eventlog = createEventlog();

    eventlog.append(
      recipeCreated("stew", "Stew", `${STORE_ID}/stew.jpg`),
      recipeCreated("stew-copy", "Stew (copy)", `${STORE_ID}/stew.jpg`),
      recipeCreated("stolen", "Stolen", "user-victim/portrait.jpg"),
      recipeEvents.recipeDeleted({ recipeId: "stew", deletedAt: now }),
      recipeEvents.recipeDeleted({ recipeId: "stolen", deletedAt: now }),
    );

    expect(staleImageKeys(eventlog.sql, EVENTLOG, STORE_ID)).toEqual([]);
  });
});
