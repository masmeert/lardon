import { TooManyRequests } from "@lardon/api";
import { Context, Effect } from "effect";

import { errorResponse } from "./error-response";

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

export function rateLimitRuleFor(path: string): RateLimitRule | null {
  if (
    ["/api/auth/sign-in", "/api/auth/email-otp", "/api/auth/delete-user"].some((prefix) =>
      path.startsWith(prefix),
    )
  ) {
    return "auth";
  }

  if (
    path === "/api/families/join" ||
    path === "/api/follows" ||
    (path.startsWith("/api/profiles/") && path !== "/api/profiles/me")
  ) {
    return "sensitive";
  }

  if (path.startsWith("/api/")) return "api";

  return null;
}

export function clientKey(headers: Headers) {
  return headers.get("cf-connecting-ip") ?? "unknown";
}

export function tooManyRequestsResponse() {
  return errorResponse(
    new TooManyRequests({ message: "Too many attempts. Wait a minute and try again." }),
    429,
    { "retry-after": "60" },
  );
}
