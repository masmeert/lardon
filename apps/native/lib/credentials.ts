import { Match, Schema } from "effect";

export const Email = Schema.Trim.check(
  Schema.isMinLength(1, { message: "Email is required" }),
  Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Enter a valid email address" }),
);

export const describeSignInCodeError = Match.type<string | undefined>().pipe(
  Match.when("INVALID_OTP", () => "That code isn't right. Check it and try again"),
  Match.when("OTP_EXPIRED", () => "That code has expired. Request a new one"),
  Match.when("TOO_MANY_ATTEMPTS", () => "Too many wrong codes. Request a new one"),
  Match.orElse(() => undefined),
);
