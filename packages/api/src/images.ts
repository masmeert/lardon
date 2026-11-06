import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api";

import { Authorization } from "./authorization";
import { InvalidRequest, NotFound } from "./errors";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const StoreId = Schema.String.check(
  Schema.isPattern(/^(?:user|family)-[A-Za-z0-9_-]{1,64}$/),
);

export const ImageFileName = Schema.String.check(
  Schema.isPattern(/^[0-9a-f-]{36}\.(?:jpg|png|webp)$/),
);

export const ImageKey = Schema.String.check(
  Schema.isPattern(/^(?:user|family)-[A-Za-z0-9_-]{1,64}\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/),
);

export class ImageUploadApi extends HttpApiGroup.make("images")
  .add(
    HttpApiEndpoint.put("upload", "/api/stores/:storeId/images", {
      params: { storeId: StoreId },
      payload: Schema.Uint8Array.pipe(HttpApiSchema.asUint8Array()),
      success: Schema.Struct({ imageKey: ImageKey }),
      error: [NotFound, InvalidRequest],
    }),
    HttpApiEndpoint.post("copy", "/api/stores/:storeId/images/copy", {
      params: { storeId: StoreId },
      payload: Schema.Struct({ imageKey: ImageKey }),
      success: Schema.Struct({ imageKey: ImageKey }),
      error: NotFound,
    }),
  )
  .middleware(Authorization) {}

export class ImageDownloadApi extends HttpApiGroup.make("imageFiles").add(
  HttpApiEndpoint.get("download", "/images/:storeId/:fileName", {
    params: { storeId: StoreId, fileName: ImageFileName },
    success: Schema.Uint8Array.pipe(HttpApiSchema.asUint8Array()),
    error: NotFound,
  }),
) {}
