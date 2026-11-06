import { Context, Effect } from "effect";

export type StoredImage = { body: ReadableStream<Uint8Array>; contentType: string };

export class ImageStorage extends Context.Service<
  ImageStorage,
  {
    put(key: string, bytes: Uint8Array, contentType: string): Effect.Effect<void>;
    get(key: string): Effect.Effect<StoredImage | null>;
    copy(sourceKey: string, targetKey: string): Effect.Effect<boolean>;
    delete(key: string): Effect.Effect<void>;
    deleteAll(prefix: string): Effect.Effect<void>;
  }
>()("lardon/server/ImageStorage") {
  static fromR2(bucket: R2Bucket) {
    const get = (key: string) =>
      Effect.promise(() => bucket.get(key)).pipe(
        Effect.map((object) =>
          object
            ? {
                body: object.body,
                contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
              }
            : null,
        ),
      );

    return ImageStorage.of({
      put: (key, bytes, contentType) =>
        Effect.promise(() => bucket.put(key, bytes, { httpMetadata: { contentType } })).pipe(
          Effect.asVoid,
        ),
      get,
      copy: Effect.fn("ImageStorage.copy")(function* (sourceKey: string, targetKey: string) {
        const source = yield* get(sourceKey);

        if (!source) return false;
        yield* Effect.promise(() =>
          bucket.put(targetKey, source.body, { httpMetadata: { contentType: source.contentType } }),
        );

        return true;
      }),
      delete: (key) => Effect.promise(() => bucket.delete(key)),
      deleteAll: Effect.fn("ImageStorage.deleteAll")(function* (prefix: string) {
        let cursor: string | undefined;

        do {
          const page = yield* Effect.promise(() => bucket.list({ prefix, cursor }));

          if (page.objects.length > 0) {
            yield* Effect.promise(() => bucket.delete(page.objects.map((object) => object.key)));
          }

          cursor = page.truncated ? page.cursor : undefined;
        } while (cursor);
      }),
    });
  }
}
