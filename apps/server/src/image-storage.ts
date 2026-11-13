import { Context, Effect } from "effect";

export type StoredImage = { body: ReadableStream<Uint8Array>; contentType: string };

export type ListedImage = { key: string; uploadedMs: number };

export class ImageStorage extends Context.Service<
  ImageStorage,
  {
    put(key: string, bytes: Uint8Array, contentType: string): Effect.Effect<void>;
    get(key: string): Effect.Effect<StoredImage | null>;
    copy(sourceKey: string, targetKey: string): Effect.Effect<boolean>;
    list(prefix: string): Effect.Effect<ListedImage[]>;
    deleteMany(keys: readonly string[]): Effect.Effect<void>;
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
      list: Effect.fn("ImageStorage.list")(function* (prefix: string) {
        const images: ListedImage[] = [];
        let cursor: string | undefined;

        do {
          const page = yield* Effect.promise(() => bucket.list({ prefix, cursor }));
          images.push(
            ...page.objects.map((object) => ({
              key: object.key,
              uploadedMs: object.uploaded.getTime(),
            })),
          );
          cursor = page.truncated ? page.cursor : undefined;
        } while (cursor);

        return images;
      }),
      deleteMany: Effect.fn("ImageStorage.deleteMany")(function* (keys: readonly string[]) {
        for (let start = 0; start < keys.length; start += 1000) {
          yield* Effect.promise(() => bucket.delete(keys.slice(start, start + 1000)));
        }
      }),
    });
  }
}

export function familyImagePrefix(familyId: string) {
  return `families/${familyId}/`;
}

const IMAGE_GRACE_MS = 24 * 60 * 60 * 1000;

export function unreferencedImageKeys(
  listed: readonly ListedImage[],
  referencedKeys: ReadonlySet<string>,
  nowMs: number,
) {
  return listed.flatMap(({ key, uploadedMs }) => {
    const imageKey = key.slice(key.lastIndexOf("/") + 1);

    return referencedKeys.has(imageKey) || nowMs - uploadedMs < IMAGE_GRACE_MS ? [] : [key];
  });
}
