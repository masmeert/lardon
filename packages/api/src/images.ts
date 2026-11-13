import { ImageKey } from "@lardon/recipes/tables";
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api";

import { Authorization } from "./authorization";
import { InvalidRequest, NotFound } from "./errors";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const Image = Schema.Struct({ imageKey: ImageKey });

export class ImagesApi extends HttpApiGroup.make("images")
  .add(
    HttpApiEndpoint.put("upload", "/:familyId/images", {
      params: { familyId: Schema.String },
      payload: Schema.Uint8Array.pipe(HttpApiSchema.asUint8Array()),
      success: Image,
      error: [NotFound, InvalidRequest],
    }),
    HttpApiEndpoint.post("copy", "/:familyId/images/copy", {
      params: { familyId: Schema.String },
      payload: Schema.Struct({ sourceFamilyId: Schema.String, imageKey: ImageKey }),
      success: Image,
      error: NotFound,
    }),
    HttpApiEndpoint.get("download", "/:familyId/images/:imageKey", {
      params: { familyId: Schema.String, imageKey: ImageKey },
      success: Schema.Uint8Array.pipe(HttpApiSchema.asUint8Array()),
      error: NotFound,
    }),
  )
  .middleware(Authorization)
  .prefix("/api/families") {}
