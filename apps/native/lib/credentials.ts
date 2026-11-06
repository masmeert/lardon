import { Schema } from "effect";

export const Email = Schema.Trim.check(
  Schema.isMinLength(1, { message: "Email is required" }),
  Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Enter a valid email address" }),
);

export const Password = Schema.String.check(
  Schema.isMinLength(1, { message: "Password is required" }),
  Schema.isMinLength(8, { message: "Use at least 8 characters" }),
);

export const Name = Schema.Trim.check(
  Schema.isMinLength(1, { message: "Name is required" }),
  Schema.isMinLength(2, { message: "Name must be at least 2 characters" }),
);
