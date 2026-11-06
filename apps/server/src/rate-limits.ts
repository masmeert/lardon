import { TooManyRequests } from "@lardon/api";
import { Context, Effect } from "effect";

export type RateLimitRule = "auth" | "sensitive" | "api";

export class RateLimits extends Context.Service<
  RateLimits,
  { allow(rule: RateLimitRule, key: string): Effect.Effect<boolean> }
>()("lardon/server/RateLimits") {
  static fromCloudflare(bindings: Record<RateLimitRule, RateLimit>) {
    return RateLimits.of({
      allow: (rule, key) =>
        Effect.promise(() => bindings[rule].limit({ key: `${rule}:${key}` })).pipe(
          Effect.map((outcome) => outcome.success),
        ),
    });
  }
}

const AUTH_PATHS = [
  "/api/auth/sign-in",
  "/api/auth/sign-up",
  "/api/auth/request-password-reset",
  "/api/auth/forget-password",
  "/api/auth/reset-password",
  "/api/auth/send-verification-email",
  "/api/auth/delete-user",
  "/api/auth/change-password",
];

export function rateLimitRuleFor(method: string, path: string): RateLimitRule | null {
  if (AUTH_PATHS.some((prefix) => path.startsWith(prefix))) return "auth";
  if (path === "/api/families/join") return "sensitive";
  if (method !== "GET" && /^\/api\/stores\/[^/]+\/images/.test(path)) return "sensitive";
  if (path.startsWith("/api/") || path === "/sync") return "api";
  return null;
}

export const tooManyRequests = new TooManyRequests({
  message: "Too many attempts. Wait a minute and try again.",
});
