import type { AuthedContext } from "../context";
import { badRequest } from "../errors";
import { loadRecipe, setRecipeImageKey } from "../recipes/service";
import { type ImageContentType, imageKeyFor } from "./storage";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function sniffImageType(bytes: Uint8Array): ImageContentType | null {
  function startsWith(offset: number, ...signature: number[]) {
    return signature.every((byte, index) => bytes[offset + index] === byte);
  }

  if (startsWith(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (startsWith(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (startsWith(0, 0x52, 0x49, 0x46, 0x46) && startsWith(8, 0x57, 0x45, 0x42, 0x50)) {
    return "image/webp";
  }
  return null;
}

export async function uploadRecipeImage(
  context: AuthedContext,
  recipeId: string,
  bytes: Uint8Array,
) {
  if (bytes.byteLength === 0) throw badRequest("The image is empty. Choose another picture.");
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw badRequest("The image is larger than 5 MB. Choose a smaller picture or resize it.");
  }
  const contentType = sniffImageType(bytes);
  if (!contentType) throw badRequest("The image must be a JPEG, PNG or WebP file.");

  await loadRecipe(context.db, context.session.user.id, recipeId);

  const key = imageKeyFor(recipeId, contentType);
  await context.images.put(key, bytes, contentType);
  try {
    const { recipe, previousKey } = await setRecipeImageKey(context, recipeId, key);
    if (previousKey) await context.images.delete([previousKey]);
    return recipe;
  } catch (error) {
    await context.images.delete([key]);
    throw error;
  }
}

export async function removeRecipeImage(context: AuthedContext, recipeId: string) {
  const { recipe, previousKey } = await setRecipeImageKey(context, recipeId, null);
  if (previousKey) await context.images.delete([previousKey]);
  return recipe;
}
