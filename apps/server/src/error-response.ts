import type { NotFound, TooManyRequests, Unauthorized } from "@lardon/api";

export function errorResponse(
  error: NotFound | TooManyRequests | Unauthorized,
  status: number,
  headers?: HeadersInit,
) {
  return Response.json({ _tag: error._tag, message: error.message }, { status, headers });
}
