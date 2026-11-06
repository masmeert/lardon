import type { Context } from "../context";

export type StoredImage = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export interface ImageStore {
  put(key: string, data: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<StoredImage | null>;
  delete(keys: string[]): Promise<void>;
}

export const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ImageContentType = keyof typeof IMAGE_EXTENSIONS;

export const IMAGE_KEY_PATTERN = /^recipes\/[0-9a-fA-F-]{36}\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/;

export function imageKeyFor(recipeId: string, contentType: ImageContentType) {
  return `recipes/${recipeId}/${crypto.randomUUID()}.${IMAGE_EXTENSIONS[contentType]}`;
}

export async function copyImage(
  context: Pick<Context, "images">,
  sourceKey: string,
  targetRecipeId: string,
) {
  const source = await context.images.get(sourceKey);
  if (!source || !(source.contentType in IMAGE_EXTENSIONS)) return null;
  const key = imageKeyFor(targetRecipeId, source.contentType as ImageContentType);
  await context.images.put(key, new Uint8Array(await source.arrayBuffer()), source.contentType);
  return key;
}
