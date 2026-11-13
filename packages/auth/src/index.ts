import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import type { Database } from "@lardon/db";
import * as schema from "@lardon/db/schema/auth";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  CORS_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  APPLE_BUNDLE_ID: string;
};

export type SignInCode = { to: string; code: string };

export type AuthHooks = {
  sendSignInCode(email: SignInCode): Promise<void>;
  afterCreateUser(userId: string): Promise<void>;
  beforeDeleteUser(userId: string): Promise<void>;
};

const withoutProviderTokens = <Account extends object>(account: Account) =>
  Promise.resolve({
    data: { ...account, accessToken: null, refreshToken: null, idToken: null },
  });

export function createAuth(env: AuthConfig, database: Database, hooks: AuthHooks) {
  return betterAuth({
    database: drizzleAdapter(database, { provider: "sqlite", schema }),
    trustedOrigins: [env.CORS_ORIGIN, "lardon://", "exp://", "http://localhost:8081"],
    socialProviders: {
      google: {
        enabled: env.GOOGLE_CLIENT_ID !== "" && env.GOOGLE_CLIENT_SECRET !== "",
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account",
      },
      apple: {
        enabled: env.APPLE_BUNDLE_ID !== "",
        clientId: env.APPLE_BUNDLE_ID,
        clientSecret: "",
        appBundleIdentifier: env.APPLE_BUNDLE_ID,
      },
    },
    user: {
      deleteUser: { enabled: true, beforeDelete: (user) => hooks.beforeDeleteUser(user.id) },
    },
    databaseHooks: {
      user: { create: { after: (user) => hooks.afterCreateUser(user.id) } },
      account: {
        create: { before: withoutProviderTokens },
        update: { before: withoutProviderTokens },
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: { sameSite: "none", secure: true, httpOnly: true },
    },
    plugins: [
      expo(),
      emailOTP({
        storeOTP: "hashed",
        sendVerificationOTP: async ({ email, otp, type }) => {
          if (type === "sign-in") await hooks.sendSignInCode({ to: email, code: otp });
        },
      }),
    ],
  });
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
