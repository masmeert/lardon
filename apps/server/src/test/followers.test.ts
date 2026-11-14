import { user } from "@lardon/db/schema/auth";
import { block, follow, profile, publishedRecipe } from "@lardon/db/schema/followers";
import { eq, or } from "@lardon/db/orm";
import type { RecipeSnapshot } from "@lardon/recipes/snapshot";
import { Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { Database } from "../database";
import { type Publication, reconcilePublications } from "../published-recipes";
import { StoredImages, createUser, runTest } from "./environment";

const TINY_PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  ),
  (character) => character.charCodeAt(0),
);

function snapshot(title: string): RecipeSnapshot {
  return { title, ingredients: [{ name: "eggs", quantity: 2 }], steps: ["Whisk."] };
}

function publication(recipeId: string, authorId: string, title = "Omelette"): Publication {
  return { recipeId, authorId, recipe: snapshot(title), imageKey: null };
}

const person = Effect.fn("person")(function* (name: string) {
  const created = yield* createUser(name);
  const families = yield* created.api.families.list();

  yield* created.api.profiles.save({
    payload: { username: name.toLowerCase(), bio: `${name} cooks.` },
  });

  return { ...created, familyId: families[0]!.id };
});

const follower = Effect.fn("follower")(function* (
  author: Effect.Success<ReturnType<typeof person>>,
  name: string,
) {
  const created = yield* person(name);
  yield* created.api.follows.follow({ payload: { userId: author.id } });
  yield* author.api.follows.approve({ params: { userId: created.id } });

  return created;
});

describe("profiles", () => {
  it("starts without one and takes a unique username", () =>
    runTest(
      Effect.gen(function* () {
        const alice = yield* createUser("Alice");
        const bob = yield* createUser("Bob");

        expect(yield* alice.api.profiles.me()).toEqual({ profile: null });

        const saved = yield* alice.api.profiles.save({
          payload: { username: "alice.cooks", bio: "" },
        });

        expect(saved).toEqual({
          userId: alice.id,
          name: "Alice",
          image: null,
          username: "alice.cooks",
          bio: null,
        });

        const taken = yield* Effect.flip(
          bob.api.profiles.save({ payload: { username: "alice.cooks", bio: "" } }),
        );

        expect(taken.message).toBe("@alice.cooks is taken. Try another username.");

        const renamed = yield* alice.api.profiles.save({
          payload: { username: "alice", bio: "Soups mostly." },
        });

        expect(renamed.bio).toBe("Soups mostly.");
      }),
    ));

  it("is found by its exact username and shows only name, photo and bio to strangers", () =>
    runTest(
      Effect.gen(function* () {
        const alice = yield* person("Alice");
        const bob = yield* person("Bob");

        const seen = yield* bob.api.profiles.get({ params: { username: "Alice" } });

        expect(seen).toMatchObject({
          userId: alice.id,
          username: "alice",
          bio: "Alice cooks.",
          isSelf: false,
          following: "none",
          follower: "none",
          isBlocked: false,
          recipeCount: null,
          followerCount: null,
          followingCount: null,
        });

        const missing = yield* Effect.flip(bob.api.profiles.get({ params: { username: "ali" } }));
        expect(missing._tag).toBe("NotFound");
      }),
    ));
});

describe("follows", () => {
  it("asks for approval, then lets either side end it", () =>
    runTest(
      Effect.gen(function* () {
        const alice = yield* person("Alice");
        const bob = yield* person("Bob");

        const requested = yield* bob.api.follows.follow({ payload: { userId: alice.id } });
        expect(requested.following).toBe("pending");

        const requests = yield* alice.api.follows.followers();
        expect(requests.map(({ username, status }) => ({ username, status }))).toEqual([
          { username: "bob", status: "pending" },
        ]);

        yield* alice.api.follows.approve({ params: { userId: bob.id } });

        expect((yield* bob.api.profiles.get({ params: { username: "alice" } })).following).toBe(
          "approved",
        );
        expect((yield* bob.api.follows.following()).map((entry) => entry.status)).toEqual([
          "approved",
        ]);

        yield* alice.api.follows.removeFollower({ params: { userId: bob.id } });
        expect(yield* bob.api.follows.following()).toEqual([]);

        yield* bob.api.follows.follow({ payload: { userId: alice.id } });
        yield* bob.api.follows.unfollow({ params: { userId: alice.id } });
        expect(yield* alice.api.follows.followers()).toEqual([]);

        const withdrawn = yield* Effect.flip(
          alice.api.follows.approve({ params: { userId: bob.id } }),
        );

        expect(withdrawn.message).toBe("This request was withdrawn.");
      }),
    ));

  it("needs a username of your own and someone else to follow", () =>
    runTest(
      Effect.gen(function* () {
        const alice = yield* person("Alice");
        const anonymous = yield* createUser("Anonymous");

        const noProfile = yield* Effect.flip(
          anonymous.api.follows.follow({ payload: { userId: alice.id } }),
        );

        expect(noProfile._tag).toBe("InvalidRequest");

        const self = yield* Effect.flip(
          alice.api.follows.follow({ payload: { userId: alice.id } }),
        );

        expect(self.message).toBe("You can't follow yourself.");
      }),
    ));

  it("blocks by removing follows both ways and hiding the blocker", () =>
    runTest(
      Effect.gen(function* () {
        const alice = yield* person("Alice");
        const mallory = yield* follower(alice, "Mallory");
        yield* alice.api.follows.follow({ payload: { userId: mallory.id } });

        yield* alice.api.follows.block({ params: { userId: mallory.id } });

        expect(yield* alice.api.follows.followers()).toEqual([]);
        expect(yield* alice.api.follows.following()).toEqual([]);
        expect((yield* alice.api.follows.blocked()).map((entry) => entry.username)).toEqual([
          "mallory",
        ]);

        const hidden = yield* Effect.flip(
          mallory.api.profiles.get({ params: { username: "alice" } }),
        );

        expect(hidden._tag).toBe("NotFound");

        const refused = yield* Effect.flip(
          mallory.api.follows.follow({ payload: { userId: alice.id } }),
        );

        expect(refused._tag).toBe("NotFound");

        expect((yield* alice.api.profiles.get({ params: { username: "mallory" } })).isBlocked).toBe(
          true,
        );

        yield* alice.api.follows.unblock({ params: { userId: mallory.id } });
        expect((yield* mallory.api.profiles.get({ params: { username: "alice" } })).following).toBe(
          "none",
        );
      }),
    ));
});

describe("the feed", () => {
  it("shows approved followers their follows' recipes, newest first, a page at a time", () =>
    runTest(
      Effect.gen(function* () {
        const alice = yield* person("Alice");
        const bob = yield* follower(alice, "Bob");
        const carol = yield* person("Carol");
        yield* carol.api.follows.follow({ payload: { userId: alice.id } });

        yield* reconcilePublications(
          alice.familyId,
          Array.from({ length: 25 }, (_, index) =>
            publication(`recipe-${String(index).padStart(2, "0")}`, alice.id),
          ),
        );

        const first = yield* bob.api.feed.list({ query: {} });
        expect(first.recipes).toHaveLength(20);
        expect(first.recipes[0]).toMatchObject({
          recipeId: "recipe-24",
          author: { userId: alice.id, name: "Alice", username: "alice", image: null },
          recipe: snapshot("Omelette"),
        });

        const second = yield* bob.api.feed.list({ query: { cursor: first.nextCursor! } });
        expect(second.recipes.map((recipe) => recipe.recipeId)).toEqual([
          "recipe-04",
          "recipe-03",
          "recipe-02",
          "recipe-01",
          "recipe-00",
        ]);
        expect(second.nextCursor).toBeNull();

        expect((yield* carol.api.feed.list({ query: {} })).recipes).toEqual([]);
        expect(
          (yield* Effect.flip(carol.api.feed.get({ params: { recipeId: "recipe-01" } })))._tag,
        ).toBe("NotFound");

        expect(yield* bob.api.profiles.get({ params: { username: "alice" } })).toMatchObject({
          recipeCount: 25,
          followerCount: 1,
          followingCount: 0,
        });
        expect(
          (yield* alice.api.feed.list({ query: { authorId: alice.id } })).recipes,
        ).toHaveLength(20);
        expect((yield* carol.api.feed.list({ query: { authorId: alice.id } })).recipes).toEqual([]);

        yield* alice.api.follows.removeFollower({ params: { userId: bob.id } });
        expect((yield* bob.api.feed.list({ query: {} })).recipes).toEqual([]);
      }),
    ));

  it("serves the photo to followers and copies it into their own recipes", () =>
    runTest(
      Effect.gen(function* () {
        const images = yield* StoredImages;
        const alice = yield* person("Alice");
        const bob = yield* follower(alice, "Bob");
        const carol = yield* person("Carol");

        const { imageKey } = yield* alice.api.images.upload({
          params: { familyId: alice.familyId },
          payload: TINY_PNG,
        });

        yield* reconcilePublications(alice.familyId, [
          { ...publication("soup", alice.id), imageKey },
        ]);

        expect(yield* bob.api.feed.image({ params: { recipeId: "soup", imageKey } })).toEqual(
          TINY_PNG,
        );
        expect(
          (yield* Effect.flip(carol.api.feed.image({ params: { recipeId: "soup", imageKey } })))
            ._tag,
        ).toBe("NotFound");

        const copied = yield* bob.api.feed.copyImage({
          params: { recipeId: "soup" },
          payload: { familyId: bob.familyId },
        });

        expect(images.get(`families/${bob.familyId}/${copied.imageKey}`)?.bytes).toEqual(TINY_PNG);

        const elsewhere = yield* Effect.flip(
          bob.api.feed.copyImage({
            params: { recipeId: "soup" },
            payload: { familyId: alice.familyId },
          }),
        );

        expect(elsewhere._tag).toBe("NotFound");
      }),
    ));
});

describe("publishing", () => {
  it("updates in place, keeps the date and unpublishes what turns private", () =>
    runTest(
      Effect.gen(function* () {
        const database = yield* Database;
        const alice = yield* person("Alice");

        const rows = () =>
          database.use((client) =>
            client.select().from(publishedRecipe).orderBy(publishedRecipe.recipeId),
          );

        yield* reconcilePublications(alice.familyId, [
          publication("soup", alice.id),
          publication("stew", alice.id),
        ]);
        const [published] = yield* rows();

        yield* Effect.sleep("5 millis");
        yield* reconcilePublications(alice.familyId, [
          publication("soup", alice.id, "Better soup"),
        ]);

        const [edited, ...others] = yield* rows();
        expect(others).toEqual([]);
        expect(edited?.snapshot).toEqual(snapshot("Better soup"));
        expect(edited?.publishedAt).toEqual(published?.publishedAt);
        expect(edited!.updatedAt.getTime()).toBeGreaterThan(published!.updatedAt.getTime());
      }),
    ));

  it("follows a recipe into another family without losing its date or its author", () =>
    runTest(
      Effect.gen(function* () {
        const database = yield* Database;
        const alice = yield* person("Alice");
        const mallory = yield* person("Mallory");
        const family = yield* alice.api.families.create({ payload: { name: "Meerts" } });

        yield* reconcilePublications(alice.familyId, [publication("soup", alice.id)]);
        yield* reconcilePublications(family.id, [publication("soup", alice.id)]);
        yield* reconcilePublications(alice.familyId, []);
        yield* reconcilePublications(mallory.familyId, [
          publication("soup", mallory.id, "Stolen soup"),
        ]);

        const rows = yield* database.use((client) => client.select().from(publishedRecipe));
        expect(rows.map((row) => [row.familyId, row.authorId, row.snapshot])).toEqual([
          [family.id, alice.id, snapshot("Omelette")],
        ]);
      }),
    ));

  it("only publishes members and unpublishes them when they leave", () =>
    runTest(
      Effect.gen(function* () {
        const database = yield* Database;
        const alice = yield* person("Alice");
        const bob = yield* person("Bob");
        const family = yield* alice.api.families.create({ payload: { name: "Meerts" } });
        const invite = yield* alice.api.families.createInvite({ params: { familyId: family.id } });

        yield* reconcilePublications(family.id, [publication("stew", bob.id)]);
        yield* bob.api.families.join({ payload: { code: invite.code } });
        yield* reconcilePublications(family.id, [
          publication("stew", bob.id),
          publication("soup", alice.id),
        ]);

        const authors = () =>
          database
            .use((client) => client.select().from(publishedRecipe))
            .pipe(Effect.map((rows) => rows.map((row) => row.authorId).sort()));

        expect(yield* authors()).toEqual([alice.id, bob.id].sort());

        yield* bob.api.families.leave({ params: { familyId: family.id } });
        expect(yield* authors()).toEqual([alice.id]);
      }),
    ));
});

describe("deleting an account", () => {
  it("deletes its profile, follows, blocks and published recipes", () =>
    runTest(
      Effect.gen(function* () {
        const database = yield* Database;
        const alice = yield* person("Alice");
        const bob = yield* follower(alice, "Bob");
        const carol = yield* person("Carol");
        yield* alice.api.follows.block({ params: { userId: carol.id } });
        yield* reconcilePublications(alice.familyId, [publication("soup", alice.id)]);

        yield* database.use((client) => client.delete(user).where(eq(user.id, alice.id)));

        const left = yield* database.use((client) =>
          Promise.all([
            client.select().from(profile).where(eq(profile.userId, alice.id)),
            client
              .select()
              .from(follow)
              .where(or(eq(follow.followerId, alice.id), eq(follow.followeeId, alice.id))),
            client.select().from(block).where(eq(block.blockerId, alice.id)),
            client.select().from(publishedRecipe),
          ]),
        );

        expect(left).toEqual([[], [], [], []]);
        expect(yield* bob.api.feed.list({ query: {} })).toEqual({
          recipes: [],
          nextCursor: null,
        });
      }),
    ));
});
