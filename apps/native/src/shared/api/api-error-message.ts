import { Forbidden, InvalidRequest, NotFound, TooManyRequests } from "@lardon/api";

export function apiErrorMessage(error: Error, fallback: string) {
  return [Forbidden, InvalidRequest, NotFound, TooManyRequests].some(
    (type) => error instanceof type,
  )
    ? error.message
    : fallback;
}
