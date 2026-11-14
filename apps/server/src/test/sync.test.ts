import { createRecipe, emptyDraft } from "@lardon/recipes";
import { createRecipeStore } from "@lardon/recipes/tables";
import { Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { USER_HEADER } from "../family-stores";
import { allowsChange } from "../sync-rules";
import { syncFamilyId, syncResponse } from "../sync";
import { FamilyStoreCalls, createUser, runTest } from "./environment";

function upgrade(familyId: string, cookie?: string) {
  const headers = new Headers({ upgrade: "websocket", [USER_HEADER]: "mallory" });

  if (cookie !== undefined) headers.set("cookie", cookie);

  return new Request(`http://localhost/sync/${familyId}`, { headers });
}

describe("sync route", () => {
  it("reads the family from the path", () => {
    expect(syncFamilyId(new Request("http://localhost/sync/4f2c-9a"))).toBe("4f2c-9a");
    expect(syncFamilyId(new Request("http://localhost/sync/a/b"))).toBeUndefined();
    expect(syncFamilyId(new Request("http://localhost/api/sync/a"))).toBeUndefined();
  });

  it("connects members only, as themselves", () =>
    runTest(
      Effect.gen(function* () {
        const calls = yield* FamilyStoreCalls;
        const alice = yield* createUser("Alice");
        const bob = yield* createUser("Bob");
        const family = yield* alice.api.families.create({ payload: { name: "Meerts" } });

        const anonymous = yield* syncResponse(upgrade(family.id), family.id);
        expect(anonymous.status).toBe(401);

        const outsider = yield* syncResponse(upgrade(family.id, `test-user=${bob.id}`), family.id);
        expect(outsider.status).toBe(404);
        expect(calls.connected).toEqual([]);

        const member = yield* syncResponse(upgrade(family.id, `test-user=${alice.id}`), family.id);
        expect(member.status).toBe(204);
        expect(calls.connected.map(({ familyId, userId }) => [familyId, userId])).toEqual([
          [family.id, alice.id],
        ]);
      }),
    ));
});

describe("write rules", () => {
  const store = createRecipeStore();
  const recipeId = createRecipe(store, { ...emptyDraft(), title: "Soup" }, "alice");

  const change = (
    userId: string,
    cellId: string,
    cell: string | number | undefined,
    rowId = recipeId,
  ) => allowsChange(store, userId, { tableId: "recipes", rowId, cellId, cell });

  it("lets any member edit, but only the creator change visibility", () => {
    expect(change("bob", "title", "Bob's soup")).toBe(true);
    expect(change("bob", "visibility", "followers")).toBe(false);
    expect(change("alice", "visibility", "followers")).toBe(true);
  });

  it("only accepts a new recipe in the sender's own name, and never changes its creator", () => {
    expect(change("bob", "createdById", "bob", "new-recipe")).toBe(true);
    expect(change("bob", "createdById", "alice", "new-recipe")).toBe(false);
    expect(change("bob", "createdById", "bob")).toBe(false);
    expect(change("alice", "createdById", "alice")).toBe(true);
  });

  it("never lets anyone take over a recipe by deleting its creator", () => {
    const taken = createRecipe(store, { ...emptyDraft(), title: "Stew" }, "alice");

    expect(change("bob", "createdById", undefined, taken)).toBe(true);
    store.delCell("recipes", taken, "createdById");

    expect(change("bob", "createdById", "bob", taken)).toBe(false);
    expect(change("bob", "visibility", "followers", taken)).toBe(false);
    expect(change("alice", "createdById", "alice", taken)).toBe(false);
  });

  it("accepts a creator that arrives after the rest of a new recipe", () => {
    store.setCell("recipes", "late-recipe", "title", "Soup");

    expect(change("bob", "createdById", "bob", "late-recipe")).toBe(true);
    expect(change("bob", "visibility", "followers", "late-recipe")).toBe(true);
  });

  it("rejects invalid cells and accepts deletions", () => {
    expect(change("alice", "title", " ")).toBe(false);
    expect(change("alice", "servings", -1)).toBe(false);
    expect(change("bob", "title", undefined)).toBe(true);
    expect(
      allowsChange(store, "alice", { tableId: "users", rowId: "x", cellId: "name", cell: "x" }),
    ).toBe(false);
  });
});
