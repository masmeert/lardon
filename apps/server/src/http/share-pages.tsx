import { Effect, Layer, Match } from "effect";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HttpRouter, HttpServerResponse } from "effect/http";

import { ImageStorage } from "../image-storage";
import { MessagePage } from "../share-page/message-page";
import { SharePage } from "../share-page/share-page";
import { Shares, shareImagePrefix } from "../shares";

function htmlPage(page: ReactElement) {
  return HttpServerResponse.html(`<!doctype html>${renderToStaticMarkup(page)}`);
}

const expiredPage = htmlPage(
  <MessagePage
    title="This link has expired"
    message="Recipe links work for 7 days. Ask for a new one."
  />,
).pipe(HttpServerResponse.setStatus(410));

const missingPage = htmlPage(
  <MessagePage title="This link doesn't exist" message="Check that you copied the whole link." />,
).pipe(HttpServerResponse.setStatus(404));

export const SharePageRoutes = Layer.unwrap(
  Effect.gen(function* () {
    const shares = yield* Shares;
    const images = yield* ImageStorage;

    return Layer.mergeAll(
      HttpRouter.add(
        "GET",
        "/r/:token",
        Effect.gen(function* () {
          const { token = "" } = yield* HttpRouter.params;
          const shared = yield* shares.find(token);

          return Match.value(shared).pipe(
            Match.discriminatorsExhaustive("kind")({
              missing: () => missingPage,
              expired: () => expiredPage,
              active: ({ recipe, imageKey, expiresAt }) =>
                htmlPage(
                  <SharePage
                    recipe={recipe}
                    url={`${shares.origin}/r/${token}`}
                    photoUrl={imageKey ? `${shares.origin}/r/${token}/photo` : null}
                    expiresAt={expiresAt}
                  />,
                ).pipe(HttpServerResponse.setHeader("Cache-Control", "public, max-age=300")),
            }),
          );
        }),
      ),
      HttpRouter.add(
        "GET",
        "/r/:token/photo",
        Effect.gen(function* () {
          const { token = "" } = yield* HttpRouter.params;
          const shared = yield* shares.find(token);

          if (shared.kind !== "active" || !shared.imageKey) {
            return HttpServerResponse.empty({ status: shared.kind === "expired" ? 410 : 404 });
          }

          const image = yield* images.get(`${shareImagePrefix}${shared.imageKey}`);

          if (!image) return HttpServerResponse.empty({ status: 404 });

          return HttpServerResponse.fromWeb(
            new Response(image.body, {
              headers: {
                "Content-Type": image.contentType,
                "Cache-Control": "public, max-age=3600",
              },
            }),
          );
        }),
      ),
    );
  }),
);
