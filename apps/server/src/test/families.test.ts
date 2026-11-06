import { NotFound } from "@lardon/api";
import { familyStoreId } from "@lardon/recipes/store-id";
import { Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { DeletedStores, createUser, runTest } from "./environment";

const createFamilyWith = Effect.fn("createFamilyWith")(function* (names: string[]) {
  const users = yield* Effect.forEach(names, createUser);
  const [owner, ...others] = users;
  const family = yield* owner!.api.families.create({ payload: { name: "The Meerts" } });
  const invite = yield* owner!.api.families.createInvite({ params: { familyId: family.id } });
  yield* Effect.forEach(others, (member) =>
    member.api.families.join({ payload: { code: invite.code } }),
  );

  return { users, family, invite };
});

describe("families", () => {
  it("creates a family and lets others join with an invite code", () =>
    runTest(
      Effect.gen(function* () {
        const { users, family, invite } = yield* createFamilyWith(["Alice", "Bob"]);
        const [alice, bob] = users;

        expect(invite.code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
        const details = yield* bob!.api.families.get({ params: { familyId: family.id } });
        expect(details.role).toBe("member");
        expect(details.members.map((member) => [member.name, member.role])).toEqual([
          ["Alice", "owner"],
          ["Bob", "member"],
        ]);
        expect(details.invites.map((active) => active.code)).toEqual([invite.code]);
        expect(details.createdAt).toBeInstanceOf(Date);

        yield* bob!.api.families.join({
          payload: { code: invite.code.toLowerCase().replace(/-/g, " ") },
        });
        const families = yield* alice!.api.families.list();
        expect(families).toEqual([
          expect.objectContaining({ id: family.id, role: "owner", memberCount: 2 }),
        ]);
      }),
    ));

  it("rejects unknown or revoked invite codes", () =>
    runTest(
      Effect.gen(function* () {
        const { users, invite } = yield* createFamilyWith(["Alice"]);
        const carol = yield* createUser("Carol");

        const unknown = yield* carol.api.families
          .join({ payload: { code: "AAAA-BBBB-CCCC" } })
          .pipe(Effect.flip);

        expect(unknown._tag).toBe("NotFound");

        yield* users[0]!.api.families.revokeInvite({ params: { code: invite.code } });

        const revoked = yield* carol.api.families
          .join({ payload: { code: invite.code } })
          .pipe(Effect.flip);

        expect(revoked._tag).toBe("NotFound");
      }),
    ));

  it("hides families from non-members and validates names", () =>
    runTest(
      Effect.gen(function* () {
        const { family } = yield* createFamilyWith(["Alice"]);
        const mallory = yield* createUser("Mallory");

        const hidden = yield* mallory.api.families
          .get({ params: { familyId: family.id } })
          .pipe(Effect.flip);

        expect(hidden).toEqual(new NotFound({ message: "This family doesn't exist." }));

        const invalid = yield* mallory.api.families
          .create({ payload: { name: "   " } })
          .pipe(Effect.flip);

        expect(invalid._tag).toBe("SchemaError");
      }),
    ));

  it("hands ownership to the next member when the owner leaves", () =>
    runTest(
      Effect.gen(function* () {
        const { users, family } = yield* createFamilyWith(["Alice", "Bob", "Carol"]);
        const [alice, bob] = users;

        yield* alice!.api.families.leave({ params: { familyId: family.id } });
        const details = yield* bob!.api.families.get({ params: { familyId: family.id } });
        expect(details.role).toBe("owner");
        expect(details.members.map((member) => member.name)).toEqual(["Bob", "Carol"]);
        expect(yield* DeletedStores).toEqual([]);
      }),
    ));

  it("lets only owners delete a family, which deletes its recipe store", () =>
    runTest(
      Effect.gen(function* () {
        const { users, family } = yield* createFamilyWith(["Alice", "Bob"]);
        const [alice, bob] = users;

        const forbidden = yield* bob!.api.families
          .delete({ params: { familyId: family.id } })
          .pipe(Effect.flip);

        expect(forbidden._tag).toBe("Forbidden");

        yield* alice!.api.families.delete({ params: { familyId: family.id } });
        expect(yield* alice!.api.families.list()).toEqual([]);
        expect(yield* bob!.api.families.list()).toEqual([]);
        expect(yield* DeletedStores).toEqual([familyStoreId(family.id)]);
      }),
    ));

  it("deletes the family and its recipe store when its last member leaves", () =>
    runTest(
      Effect.gen(function* () {
        const { users, family } = yield* createFamilyWith(["Alice"]);
        yield* users[0]!.api.families.leave({ params: { familyId: family.id } });
        expect(yield* users[0]!.api.families.list()).toEqual([]);
        expect(yield* DeletedStores).toEqual([familyStoreId(family.id)]);
      }),
    ));

  it("manages member roles", () =>
    runTest(
      Effect.gen(function* () {
        const { users, family } = yield* createFamilyWith(["Alice", "Bob"]);
        const [alice, bob] = users;
        const familyId = family.id;

        const forbidden = yield* bob!.api.families
          .removeMember({ params: { familyId, userId: alice!.id } })
          .pipe(Effect.flip);

        expect(forbidden._tag).toBe("Forbidden");

        const lastOwner = yield* alice!.api.families
          .setMemberRole({ params: { familyId, userId: alice!.id }, payload: { role: "member" } })
          .pipe(Effect.flip);

        expect(lastOwner._tag).toBe("InvalidRequest");

        yield* alice!.api.families.setMemberRole({
          params: { familyId, userId: bob!.id },
          payload: { role: "owner" },
        });
        yield* bob!.api.families.rename({ params: { familyId }, payload: { name: "Team Lardon" } });

        const details = yield* bob!.api.families.removeMember({
          params: { familyId, userId: alice!.id },
        });

        expect(details.name).toBe("Team Lardon");
        expect(details.members.map((member) => member.name)).toEqual(["Bob"]);
      }),
    ));
});
