import { InvalidRequest, NotFound } from "@lardon/api";
import { Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { Families } from "../families";
import { createUser, runTest } from "./environment";

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

const sharedFamilies = Effect.fn("sharedFamilies")(function* (
  account: Effect.Success<ReturnType<typeof createUser>>,
) {
  return (yield* account.api.families.list()).filter((family) => !family.personal);
});

describe("personal family", () => {
  it("gives every account one personal family, listed first", () =>
    runTest(
      Effect.gen(function* () {
        const { users, family } = yield* createFamilyWith(["Alice"]);
        const families = yield* users[0]!.api.families.list();

        expect(families.map((summary) => [summary.personal, summary.memberCount])).toEqual([
          [true, 1],
          [false, 1],
        ]);
        expect(families[1]?.id).toBe(family.id);

        yield* (yield* Families).createPersonal(users[0]!.id);
        expect(yield* users[0]!.api.families.list()).toHaveLength(2);
      }),
    ));

  it("can't be shared, renamed, deleted or left", () =>
    runTest(
      Effect.gen(function* () {
        const alice = yield* createUser("Alice");
        const [personal] = yield* alice.api.families.list();
        const params = { familyId: personal!.id };

        const refusals = yield* Effect.all([
          alice.api.families.createInvite({ params }).pipe(Effect.flip),
          alice.api.families.rename({ params, payload: { name: "Mine" } }).pipe(Effect.flip),
          alice.api.families.delete({ params }).pipe(Effect.flip),
          alice.api.families.leave({ params }).pipe(Effect.flip),
        ]);

        expect(refusals).toEqual([
          new InvalidRequest({
            message:
              "Nobody can join your own recipes. Create a family to share recipes with others.",
          }),
          new InvalidRequest({ message: "Your own recipes can't be renamed." }),
          new InvalidRequest({ message: "Your own recipes are deleted only with your account." }),
          new InvalidRequest({ message: "You can't leave your own recipes." }),
        ]);
      }),
    ));
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
        expect(details.personal).toBe(false);
        expect(details.members.map((member) => [member.name, member.role])).toEqual([
          ["Alice", "owner"],
          ["Bob", "member"],
        ]);
        expect(details.invites.map((active) => active.code)).toEqual([invite.code]);

        yield* bob!.api.families.join({
          payload: { code: invite.code.toLowerCase().replace(/-/g, " ") },
        });
        expect(yield* sharedFamilies(alice!)).toEqual([
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
        const families = yield* Families;

        const hidden = yield* mallory.api.families
          .get({ params: { familyId: family.id } })
          .pipe(Effect.flip);

        expect(hidden).toEqual(new NotFound({ message: "This family doesn't exist." }));
        expect(yield* families.isMember(mallory.id, family.id)).toBe(false);

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
      }),
    ));

  it("lets only owners delete a family", () =>
    runTest(
      Effect.gen(function* () {
        const { users, family } = yield* createFamilyWith(["Alice", "Bob"]);
        const [alice, bob] = users;

        const forbidden = yield* bob!.api.families
          .delete({ params: { familyId: family.id } })
          .pipe(Effect.flip);

        expect(forbidden._tag).toBe("Forbidden");

        yield* alice!.api.families.delete({ params: { familyId: family.id } });
        expect(yield* sharedFamilies(alice!)).toEqual([]);
        expect(yield* sharedFamilies(bob!)).toEqual([]);
      }),
    ));

  it("deletes the family when its last member leaves", () =>
    runTest(
      Effect.gen(function* () {
        const { users, family } = yield* createFamilyWith(["Alice"]);
        yield* users[0]!.api.families.leave({ params: { familyId: family.id } });
        expect(yield* sharedFamilies(users[0]!)).toEqual([]);
      }),
    ));

  it("manages member roles and membership", () =>
    runTest(
      Effect.gen(function* () {
        const { users, family } = yield* createFamilyWith(["Alice", "Bob"]);
        const [alice, bob] = users;
        const familyId = family.id;
        const families = yield* Families;

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
        expect(yield* families.isMember(alice!.id, familyId)).toBe(false);
        expect(yield* families.isMember(bob!.id, familyId)).toBe(true);
      }),
    ));
});

describe("forgetting an account", () => {
  it("deletes its personal family and leaves shared ones alive", () =>
    runTest(
      Effect.gen(function* () {
        const { users, family } = yield* createFamilyWith(["Alice", "Bob"]);
        const [alice, bob] = users;
        const solo = yield* alice!.api.families.create({ payload: { name: "Solo" } });
        const [personal] = yield* alice!.api.families.list();
        const families = yield* Families;

        yield* families.forgetUser(alice!.id);

        expect(yield* alice!.api.families.list()).toEqual([]);
        expect(yield* families.isMember(bob!.id, family.id)).toBe(true);

        const details = yield* bob!.api.families.get({ params: { familyId: family.id } });
        expect(details.members.map((member) => [member.name, member.role])).toEqual([
          ["Bob", "owner"],
        ]);

        const gone = yield* Effect.all([
          bob!.api.families.get({ params: { familyId: solo.id } }).pipe(Effect.flip),
          bob!.api.families.get({ params: { familyId: personal!.id } }).pipe(Effect.flip),
        ]);

        expect(gone.map((error) => error._tag)).toEqual(["NotFound", "NotFound"]);
      }),
    ));
});
