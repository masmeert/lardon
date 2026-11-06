import { describe, expect, it } from "vite-plus/test";

import { createTestEnvironment } from "./environment";

async function createFamilyWith(names: string[]) {
  const environment = await createTestEnvironment();
  const users = await Promise.all(names.map((name) => environment.createUser(name)));
  const [owner, ...others] = users;
  const family = await owner!.api.families.create({ name: "The Meerts" });
  const invite = await owner!.api.families.createInvite({ familyId: family.id });
  for (const member of others) await member.api.families.join({ code: invite.code });
  return { ...environment, users, family, invite };
}

describe("families", () => {
  it("creates a family and lets others join with an invite code", async () => {
    const { users, family, invite } = await createFamilyWith(["Alice", "Bob"]);
    const [alice, bob] = users;

    expect(invite.code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    const details = await bob!.api.families.get({ id: family.id });
    expect(details.role).toBe("member");
    expect(details.members.map((member) => [member.name, member.role])).toEqual([
      ["Alice", "owner"],
      ["Bob", "member"],
    ]);
    expect(details.invites.map((active) => active.code)).toEqual([invite.code]);

    await bob!.api.families.join({ code: invite.code.toLowerCase().replace(/-/g, " ") });
    expect(await alice!.api.families.list()).toEqual([
      expect.objectContaining({ id: family.id, role: "owner", memberCount: 2 }),
    ]);
  });

  it("rejects unknown or revoked invite codes", async () => {
    const { users, invite, createUser } = await createFamilyWith(["Alice"]);
    const carol = await createUser("Carol");
    await expect(carol.api.families.join({ code: "AAAA-BBBB-CCCC" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await users[0]!.api.families.revokeInvite({ code: invite.code });
    await expect(carol.api.families.join({ code: invite.code })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("shares family recipes with members only", async () => {
    const { users, family, createUser } = await createFamilyWith(["Alice", "Bob"]);
    const [alice, bob] = users;
    const outsider = await createUser("Mallory");

    const recipe = await alice!.api.recipes.create({ title: "Lasagne", familyId: family.id });
    expect(recipe).toMatchObject({ userId: null, familyId: family.id });

    expect((await bob!.api.recipes.list()).map((summary) => summary.id)).toEqual([recipe.id]);
    expect(await bob!.api.recipes.list({ familyId: null })).toHaveLength(0);
    expect(await bob!.api.recipes.list({ familyId: family.id })).toHaveLength(1);

    await bob!.api.recipes.update({ id: recipe.id, patch: { notes: "Use fresh pasta" } });
    await expect(bob!.api.recipes.delete({ id: recipe.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    await expect(outsider.api.recipes.get({ id: recipe.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      outsider.api.recipes.create({ title: "Spam", familyId: family.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(outsider.api.families.get({ id: family.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("moves recipes between personal and family collections", async () => {
    const { users, family } = await createFamilyWith(["Alice", "Bob"]);
    const [alice, bob] = users;

    const recipe = await alice!.api.recipes.create({ title: "Curry" });
    expect(await alice!.api.recipes.move({ id: recipe.id, familyId: family.id })).toMatchObject({
      userId: null,
      familyId: family.id,
    });

    await expect(bob!.api.recipes.move({ id: recipe.id, familyId: null })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(await bob!.api.recipes.duplicate({ id: recipe.id })).toMatchObject({
      title: "Curry",
      userId: bob!.id,
      familyId: null,
    });

    expect(await alice!.api.recipes.move({ id: recipe.id, familyId: null })).toMatchObject({
      userId: alice!.id,
      familyId: null,
    });
    await expect(bob!.api.recipes.get({ id: recipe.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("hands ownership to the next member when the owner leaves", async () => {
    const { users, family } = await createFamilyWith(["Alice", "Bob", "Carol"]);
    const [alice, bob, carol] = users;
    const recipe = await alice!.api.recipes.create({ title: "Stew", familyId: family.id });

    await alice!.api.families.leave({ familyId: family.id });
    const details = await bob!.api.families.get({ id: family.id });
    expect(details.role).toBe("owner");
    expect(details.members.map((member) => member.name)).toEqual(["Bob", "Carol"]);

    expect((await carol!.api.recipes.get({ id: recipe.id })).title).toBe("Stew");
    await expect(alice!.api.recipes.get({ id: recipe.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("returns recipes to their authors when a family is deleted", async () => {
    const { users, family } = await createFamilyWith(["Alice", "Bob"]);
    const [alice, bob] = users;
    const aliceRecipe = await alice!.api.recipes.create({ title: "Pie", familyId: family.id });
    const bobRecipe = await bob!.api.recipes.create({ title: "Soup", familyId: family.id });

    await expect(bob!.api.families.delete({ id: family.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await alice!.api.families.delete({ id: family.id });

    expect(await alice!.api.families.list()).toEqual([]);
    expect(await alice!.api.recipes.get({ id: aliceRecipe.id })).toMatchObject({
      userId: alice!.id,
      familyId: null,
    });
    expect(await bob!.api.recipes.get({ id: bobRecipe.id })).toMatchObject({
      userId: bob!.id,
      familyId: null,
    });
    await expect(bob!.api.recipes.get({ id: aliceRecipe.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("deletes the family when its last member leaves", async () => {
    const { users, family } = await createFamilyWith(["Alice"]);
    const [alice] = users;
    const recipe = await alice!.api.recipes.create({ title: "Bread", familyId: family.id });

    await alice!.api.families.leave({ familyId: family.id });
    expect(await alice!.api.families.list()).toEqual([]);
    expect((await alice!.api.recipes.get({ id: recipe.id })).familyId).toBeNull();
  });

  it("manages member roles", async () => {
    const { users, family } = await createFamilyWith(["Alice", "Bob"]);
    const [alice, bob] = users;

    await expect(
      bob!.api.families.removeMember({ familyId: family.id, userId: alice!.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      alice!.api.families.setMemberRole({ familyId: family.id, userId: alice!.id, role: "member" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await alice!.api.families.setMemberRole({
      familyId: family.id,
      userId: bob!.id,
      role: "owner",
    });
    await bob!.api.families.rename({ id: family.id, name: "Team Lardon" });
    const details = await bob!.api.families.removeMember({
      familyId: family.id,
      userId: alice!.id,
    });
    expect(details).toMatchObject({ name: "Team Lardon" });
    expect(details.members.map((member) => member.name)).toEqual(["Bob"]);
  });
});
