import { RecipeSnapshot } from "@lardon/recipes/snapshot";
import { ImageKey } from "@lardon/recipes/tables";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api";

import { Authorization } from "./authorization";
import { NotFound } from "./errors";
import { Person } from "./profiles";

export const FEED_PAGE_SIZE = 20;

export const FeedRecipe = Schema.Struct({
  recipeId: Schema.String,
  author: Person,
  recipe: RecipeSnapshot,
  imageKey: Schema.NullOr(ImageKey),
  publishedAt: Schema.DateFromString,
  updatedAt: Schema.DateFromString,
});

export type FeedRecipe = typeof FeedRecipe.Type;

export const FeedPage = Schema.Struct({
  recipes: Schema.Array(FeedRecipe),
  nextCursor: Schema.NullOr(Schema.String),
});

export type FeedPage = typeof FeedPage.Type;

const recipeParams = { recipeId: Schema.String.check(Schema.isMaxLength(64)) };

export class FeedApi extends HttpApiGroup.make("feed")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        cursor: Schema.optional(Schema.String.check(Schema.isMaxLength(100))),
        authorId: Schema.optional(Schema.String.check(Schema.isMaxLength(64))),
      },
      success: FeedPage,
    }),
    HttpApiEndpoint.get("get", "/:recipeId", {
      params: recipeParams,
      success: FeedRecipe,
      error: NotFound,
    }),
    HttpApiEndpoint.get("image", "/:recipeId/images/:imageKey", {
      params: { ...recipeParams, imageKey: ImageKey },
      success: Schema.Uint8Array.pipe(HttpApiSchema.asUint8Array()),
      error: NotFound,
    }),
    HttpApiEndpoint.post("copyImage", "/:recipeId/image-copy", {
      params: recipeParams,
      payload: Schema.Struct({ familyId: Schema.String }),
      success: Schema.Struct({ imageKey: ImageKey }),
      error: NotFound,
    }),
  )
  .middleware(Authorization)
  .prefix("/api/feed") {}
