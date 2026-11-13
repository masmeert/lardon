import { createAuth } from "@lardon/auth";
import { eq } from "@lardon/db/orm";
import { account } from "@lardon/db/schema/auth";
import { family, familyMember } from "@lardon/db/schema/families";
import { createTestDatabase } from "@lardon/db/testing";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { Database } from "../database";
import { Families } from "../families";
import { FamilyStores } from "../family-stores";
import { ImageStorage } from "../image-storage";

const config = {
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "a-test-secret-that-is-at-least-32-characters",
  CORS_ORIGIN: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  APPLE_BUNDLE_ID: "",
};

async function testAuth() {
  const client = await createTestDatabase();

  const families = Effect.runSync(
    Effect.gen(function* () {
      return yield* Families;
    }).pipe(
      Effect.provide(
        Families.layer.pipe(
          Layer.provide(
            Layer.mergeAll(
              Layer.succeed(Database, Database.make(client)),
              Layer.succeed(
                FamilyStores,
                FamilyStores.of({
                  connect: () => Effect.die("not used"),
                  disconnect: () => Effect.void,
                  delete: () => Effect.void,
                }),
              ),
              Layer.succeed(
                ImageStorage,
                ImageStorage.of({
                  put: () => Effect.void,
                  get: () => Effect.succeed(null),
                  copy: () => Effect.succeed(false),
                  list: () => Effect.succeed([]),
                  deleteMany: () => Effect.void,
                }),
              ),
            ),
          ),
        ),
      ),
    ),
  );

  const codes = new Map<string, string>();

  const auth = createAuth(config, client, {
    sendSignInCode: async ({ to, code }) => void codes.set(to, code),
    afterCreateUser: (userId) => Effect.runPromise(families.createPersonal(userId)),
    beforeDeleteUser: (userId) => Effect.runPromise(families.forgetUser(userId)),
  });

  const signIn = async (email: string) => {
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });

    const { headers, response } = await auth.api.signInEmailOTP({
      body: { email, otp: codes.get(email) ?? "" },
      returnHeaders: true,
    });

    return { userId: response.user.id, cookie: headers.get("set-cookie") ?? "" };
  };

  return { auth, client, signIn };
}

describe("better-auth hooks", () => {
  it("creates a personal family on sign-up and removes it with the account", async () => {
    const { auth, client, signIn } = await testAuth();
    const { userId, cookie } = await signIn("alice@example.com");

    const personal = await client.select().from(family).where(eq(family.personalForUserId, userId));
    expect(personal).toHaveLength(1);

    await signIn("alice@example.com");
    expect(
      await client.select().from(family).where(eq(family.personalForUserId, userId)),
    ).toHaveLength(1);

    await auth.api.deleteUser({ headers: new Headers({ cookie }), body: {} });

    expect(await client.select().from(family)).toEqual([]);
    expect(await client.select().from(familyMember)).toEqual([]);
    expect(await client.select().from(account)).toEqual([]);
  });
});
