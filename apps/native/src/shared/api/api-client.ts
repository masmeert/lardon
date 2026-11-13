import { Api, sendSessionCookie } from "@lardon/api";
import { Effect, Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import { authClient } from "#/shared/auth";
import { ENV } from "#/shared/config";

const apiRuntime = ManagedRuntime.make(
  Layer.mergeAll(
    FetchHttpClient.layer,
    sendSessionCookie(Effect.promise(() => authClient.getCookie())),
  ),
);

const apiClient = HttpApiClient.make(Api, { baseUrl: ENV.EXPO_PUBLIC_SERVER_URL });

export function requestApi<Success, Failure>(
  request: (client: Effect.Success<typeof apiClient>) => Effect.Effect<Success, Failure>,
) {
  return apiRuntime.runPromise(Effect.flatMap(apiClient, request));
}
