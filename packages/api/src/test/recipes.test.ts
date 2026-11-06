import { describe, expect, it } from "vite-plus/test";

import { uploadRecipeImage } from "../images/upload";
import { TINY_PNG, createTestEnvironment } from "./environment";

const pancakes = {
  title: "Pancakes",
  servings: 4,
  prepTimeMinutes: 10,
  cookTimeMinutes: 15,
  tags: ["Breakfast", "sweet"],
  ingredients: [
    {
      title: "Batter",
      ingredients: [
        { quantity: 200, unit: "g", name: "flour" },
        { quantity: 2, name: "eggs" },
      ],
    },
    { title: "Topping", ingredients: [{ name: "maple syrup", note: "to taste" }] },
  ],
  steps: [{ title: null, steps: [{ text: "Whisk everything." }, { text: "Fry." }] }],
};

function byId(first: { id: string }, second: { id: string }) {
  return first.id.localeCompare(second.id);
}

describe("recipes", () => {
  it("creates and reads a personal recipe with normalized content", async () => {
    const { createUser } = await createTestEnvironment();
    const alice = await createUser("Alice");

    const created = await alice.api.recipes.create({ ...pancakes, notes: "  " });
    expect(created).toMatchObject({
      title: "Pancakes",
      userId: alice.id,
      familyId: null,
      createdById: alice.id,
      notes: null,
      nutrition: null,
    });
    expect(created.ingredients[0]?.ingredients[1]).toEqual({
      quantity: 2,
      unit: null,
      name: "eggs",
      note: null,
    });
    expect(await alice.api.recipes.get({ id: created.id })).toEqual(created);
  });

  it("hides personal recipes from other users", async () => {
    const { createUser } = await createTestEnvironment();
    const alice = await createUser("Alice");
    const bob = await createUser("Bob");
    const recipe = await alice.api.recipes.create(pancakes);

    await expect(bob.api.recipes.get({ id: recipe.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      bob.api.recipes.update({ id: recipe.id, patch: { title: "Mine" } }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(bob.api.recipes.delete({ id: recipe.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(await bob.api.recipes.list()).toEqual([]);
    expect(await bob.api.recipes.getMany({ ids: [recipe.id] })).toEqual([]);
  });

  it("accepts client-generated ids but rejects collisions", async () => {
    const { createUser } = await createTestEnvironment();
    const alice = await createUser("Alice");
    const bob = await createUser("Bob");
    const id = crypto.randomUUID();

    expect((await alice.api.recipes.create({ ...pancakes, id })).id).toBe(id);
    await expect(bob.api.recipes.create({ ...pancakes, id })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("patches only the given fields and supports optimistic concurrency", async () => {
    const { createUser } = await createTestEnvironment();
    const alice = await createUser("Alice");
    const recipe = await alice.api.recipes.create(pancakes);

    const updated = await alice.api.recipes.update({
      id: recipe.id,
      baseUpdatedAt: recipe.updatedAt,
      patch: { title: "Fluffy pancakes", servings: null },
    });
    expect(updated.title).toBe("Fluffy pancakes");
    expect(updated.servings).toBeNull();
    expect(updated.tags).toEqual(["Breakfast", "sweet"]);
    expect(updated.ingredients).toEqual(recipe.ingredients);
    expect(updated.updatedAt).toBeGreaterThan(recipe.updatedAt);

    await expect(
      alice.api.recipes.update({
        id: recipe.id,
        baseUpdatedAt: recipe.updatedAt,
        patch: { title: "Stale edit" },
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("filters by tag and searches titles, tags and ingredients", async () => {
    const { createUser } = await createTestEnvironment();
    const alice = await createUser("Alice");
    await alice.api.recipes.create(pancakes);
    await alice.api.recipes.create({
      title: "Leek soup",
      tags: ["soup"],
      ingredients: [{ title: null, ingredients: [{ name: "Leeks" }, { name: "100% butter" }] }],
    });

    async function titles(input: Parameters<typeof alice.api.recipes.list>[0]) {
      return (await alice.api.recipes.list(input)).map((recipe) => recipe.title).sort();
    }

    expect(await titles({ tag: "breakfast" })).toEqual(["Pancakes"]);
    expect(await titles({ search: "leek" })).toEqual(["Leek soup"]);
    expect(await titles({ search: "FLOUR" })).toEqual(["Pancakes"]);
    expect(await titles({ search: "swe" })).toEqual(["Pancakes"]);
    expect(await titles({ search: "100%" })).toEqual(["Leek soup"]);
    expect(await titles({ search: "%" })).toEqual(["Leek soup"]);
    expect(await titles({})).toEqual(["Leek soup", "Pancakes"]);

    expect(await alice.api.recipes.tags()).toEqual([
      { tag: "Breakfast", count: 1 },
      { tag: "soup", count: 1 },
      { tag: "sweet", count: 1 },
    ]);
  });

  it("exposes a manifest for client-side caching", async () => {
    const { createUser } = await createTestEnvironment();
    const alice = await createUser("Alice");
    const pancakeRecipe = await alice.api.recipes.create(pancakes);
    const toast = await alice.api.recipes.create({ title: "Toast" });

    expect((await alice.api.recipes.manifest()).sort(byId)).toEqual(
      [pancakeRecipe, toast].map(({ id, updatedAt }) => ({ id, updatedAt })).sort(byId),
    );
    const many = await alice.api.recipes.getMany({
      ids: [pancakeRecipe.id, toast.id, "unknown"],
    });
    expect(many.map((recipe) => recipe.id).sort()).toEqual([pancakeRecipe.id, toast.id].sort());
  });

  it("validates input", async () => {
    const { createUser } = await createTestEnvironment();
    const alice = await createUser("Alice");
    await expect(alice.api.recipes.create({ title: "  " })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      alice.api.recipes.create({ title: "Toast", sourceUrl: "javascript:alert(1)" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      alice.api.recipes.create({ title: "Toast", prepTimeMinutes: -5 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("stores, replaces, copies and cleans up pictures", async () => {
    const { createUser, images } = await createTestEnvironment();
    const alice = await createUser("Alice");
    const recipe = await alice.api.recipes.create(pancakes);

    await expect(
      uploadRecipeImage(alice.context, recipe.id, new TextEncoder().encode("not an image")),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const first = await uploadRecipeImage(alice.context, recipe.id, TINY_PNG);
    expect(first.imageKey).toMatch(new RegExp(`^recipes/${recipe.id}/.+\\.png$`));
    const second = await uploadRecipeImage(alice.context, recipe.id, TINY_PNG);
    expect([...images.objects.keys()]).toEqual([second.imageKey]);

    const copy = await alice.api.recipes.duplicate({ id: recipe.id });
    expect(copy.title).toBe("Pancakes (copy)");
    expect(copy.imageKey).toMatch(new RegExp(`^recipes/${copy.id}/.+\\.png$`));
    expect(images.objects.size).toBe(2);

    await alice.api.recipes.delete({ id: recipe.id });
    await alice.api.recipes.removeImage({ id: copy.id });
    expect(images.objects.size).toBe(0);
  });
});
