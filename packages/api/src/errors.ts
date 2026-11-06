import { TRPCError } from "@trpc/server";

export function notFound(subject = "Recipe") {
  return new TRPCError({ code: "NOT_FOUND", message: `${subject} not found` });
}

export function forbidden(message: string) {
  return new TRPCError({ code: "FORBIDDEN", message });
}

export function conflict(message: string) {
  return new TRPCError({ code: "CONFLICT", message });
}

export function badRequest(message: string) {
  return new TRPCError({ code: "BAD_REQUEST", message });
}
