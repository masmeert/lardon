import { RecipeSnapshot } from "@lardon/recipes/snapshot";
import { ImageKey } from "@lardon/recipes/tables";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";

import { Authorization } from "./authorization";
import { NotFound } from "./errors";

export const ShareLink = Schema.Struct({ url: Schema.String, expiresAt: Schema.DateFromString });

export type ShareLink = typeof ShareLink.Type;

export class SharesApi extends HttpApiGroup.make("shares")
  .add(
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({
        familyId: Schema.String,
        recipeId: Schema.String,
        recipe: RecipeSnapshot,
        imageKey: Schema.optional(ImageKey),
      }),
      success: ShareLink,
      error: NotFound,
    }),
  )
  .middleware(Authorization)
  .prefix("/api/shares") {}
