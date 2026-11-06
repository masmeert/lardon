import { Context, Effect } from "effect";

export type StoredImage = { body: ReadableStream<Uint8Array>; contentType: string };

export class ImageStorage extends Context.Service<
  ImageStorage,
  {
    put(key: string, bytes: Uint8Array, contentType: string): Effect.Effect<void>;
    get(key: string): Effect.Effect<StoredImage | null>;
  }
>()("lardon/server/ImageStorage") {
  static fromR2(bucket: R2Bucket) {
    return ImageStorage.of({
      put: (key, bytes, contentType) =>
        Effect.promise(() => bucket.put(key, bytes, { httpMetadata: { contentType } })).pipe(
          Effect.asVoid,
        ),
      get: (key) =>
        Effect.promise(() => bucket.get(key)).pipe(
          Effect.map((object) =>
            object
              ? {
                  body: object.body,
                  contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
                }
              : null,
          ),
        ),
    });
  }
}
