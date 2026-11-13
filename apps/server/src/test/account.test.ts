import { Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { clientFor, createUser, runTest } from "./environment";

describe("account", () => {
  it("returns the signed-in user", () =>
    runTest(
      Effect.gen(function* () {
        const alice = yield* createUser("Alice");

        expect(yield* alice.api.account.me()).toEqual({
          id: alice.id,
          name: alice.name,
          email: alice.email,
          image: null,
        });
      }),
    ));

  it("asks a signed-out caller to sign in", () =>
    runTest(
      Effect.gen(function* () {
        const anonymous = yield* clientFor(null);
        const error = yield* Effect.flip(anonymous.account.me());

        expect(error._tag).toBe("Unauthorized");
      }),
    ));
});
