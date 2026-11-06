import { Api, Authorization } from "@lardon/api";
import { Effect, Layer } from "effect";
import { FetchHttpClient, HttpClientRequest } from "effect/http";
import { HttpApiMiddleware } from "effect/http-api";
import { AtomHttpApi } from "effect/reactivity";

import { authClient } from "@/lib/auth-client";

import { ENV } from "../src/env";

export class ApiClient extends AtomHttpApi.Service<ApiClient>()("lardon/native/ApiClient", {
  api: Api,
  baseUrl: ENV.EXPO_PUBLIC_SERVER_URL,
  httpClient: Layer.mergeAll(
    FetchHttpClient.layer,
    HttpApiMiddleware.layerClient(Authorization, ({ next, request }) =>
      Effect.flatMap(
        Effect.promise(() => authClient.getCookie()),
        (cookie) => next(cookie ? HttpClientRequest.setHeader(request, "cookie", cookie) : request),
      ),
    ),
  ),
}) {}

export const healthAtom = ApiClient.query("system", "health", {});

export const familiesAtom = ApiClient.query("families", "list", { reactivityKeys: ["families"] });
