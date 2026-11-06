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

export type AuthEmail =
  | { kind: "verify-email" | "reset-password"; to: string; name: string; url: string }
  | { kind: "sign-in-code"; to: string; code: string };

export type AuthHooks = {
  sendEmail(email: AuthEmail): Promise<void>;
  beforeDeleteUser(userId: string): Promise<void>;
};

export function createAuth(env: AuthConfig, database: Database, hooks: AuthHooks) {
  return betterAuth({
    database: drizzleAdapter(database, {
      provider: "sqlite",
      schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN, "lardon://", "exp://", "http://localhost:8081"],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) =>
        hooks.sendEmail({ kind: "reset-password", to: user.email, name: user.name, url }),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: ({ user, url }) =>
        hooks.sendEmail({ kind: "verify-email", to: user.email, name: user.name, url }),
    },
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
      deleteUser: {
        enabled: true,
        beforeDelete: (user) => hooks.beforeDeleteUser(user.id),
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [
      expo(),
      emailOTP({
        storeOTP: "hashed",
        sendVerificationOTP: async ({ email, otp, type }) => {
          if (type === "sign-in") {
            await hooks.sendEmail({ kind: "sign-in-code", to: email, code: otp });
          }
        },
      }),
    ],
  });
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
