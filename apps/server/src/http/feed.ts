import { Api } from "@lardon/api";
import { Effect } from "effect";
import { HttpServerResponse } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";

import { Feed } from "../feed";
import { asCurrentUser } from "./authorization";

export const FeedHandlers = HttpApiBuilder.group(
  Api,
  "feed",
  Effect.fn(function* (handlers) {
    const feed = yield* Feed;

    return handlers
      .handle("list", ({ query }) => asCurrentUser((userId) => feed.list(userId, query)))
      .handle("get", ({ params }) => asCurrentUser((userId) => feed.get(userId, params.recipeId)))
      .handle("copyImage", ({ params, payload }) =>
        asCurrentUser((userId) => feed.copyImage(userId, params.recipeId, payload.familyId)),
      )
      .handleRaw("image", ({ params }) =>
        asCurrentUser((userId) =>
          feed.image(userId, params.recipeId, params.imageKey).pipe(
            Effect.map((image) =>
              HttpServerResponse.fromWeb(
                new Response(image.body, {
                  headers: {
                    "Content-Type": image.contentType,
                    "Cache-Control": "private, max-age=31536000, immutable",
                  },
                }),
              ),
            ),
          ),
        ),
      );
  }),
);
