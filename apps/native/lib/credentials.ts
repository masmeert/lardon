import { Schema } from "effect";

export const Email = Schema.Trim.check(
  Schema.isMinLength(1, { message: "Email is required" }),
  Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Enter a valid email address" }),
);
