import { Api, CurrentUser, InvalidRequest, MAX_IMAGE_BYTES, NotFound } from "@lardon/api";
import { Effect } from "effect";
import { HttpServerResponse } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";

import { Families } from "../families";
import { ImageStorage } from "../image-storage";

const IMAGE_SIGNATURES = [
  { contentType: "image/jpeg", extension: "jpg", offset: 0, bytes: [0xff, 0xd8, 0xff] },
  {
    contentType: "image/png",
    extension: "png",
    offset: 0,
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { contentType: "image/webp", extension: "webp", offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
] as const;

export function sniffImageType(bytes: Uint8Array) {
  return IMAGE_SIGNATURES.find(
    (signature) =>
      signature.bytes.every((byte, index) => bytes[signature.offset + index] === byte) &&
      (signature.contentType !== "image/webp" ||
        [0x52, 0x49, 0x46, 0x46].every((byte, index) => bytes[index] === byte)),
  );
}

export const ImageUploadHandlers = HttpApiBuilder.group(
  Api,
  "images",
  Effect.fn(function* (handlers) {
    const families = yield* Families;
    const storage = yield* ImageStorage;
    return handlers.handleAll({
      upload: Effect.fn("images.upload")(function* ({ params, payload }) {
        const user = yield* CurrentUser;
        if (!(yield* families.canAccessRecipeStore(user.id, params.storeId))) {
          return yield* new NotFound({ message: "This recipe collection doesn't exist." });
        }
        if (payload.byteLength === 0) {
          return yield* new InvalidRequest({
            message: "The image is empty. Choose another picture.",
          });
        }
        if (payload.byteLength > MAX_IMAGE_BYTES) {
          return yield* new InvalidRequest({
            message: "The image is larger than 5 MB. Choose a smaller picture or resize it.",
          });
        }
        const imageType = sniffImageType(payload);
        if (!imageType) {
          return yield* new InvalidRequest({
            message: "The image must be a JPEG, PNG or WebP file.",
          });
        }
        const imageKey = `${params.storeId}/${crypto.randomUUID()}.${imageType.extension}`;
        yield* storage.put(imageKey, payload, imageType.contentType);
        return { imageKey };
      }),
      copy: Effect.fn("images.copy")(function* ({ params, payload }) {
        const user = yield* CurrentUser;
        const [sourceStoreId, fileName] = payload.imageKey.split("/") as [string, string];
        const allowed =
          (yield* families.canAccessRecipeStore(user.id, params.storeId)) &&
          (yield* families.canAccessRecipeStore(user.id, sourceStoreId));
        const imageKey = `${params.storeId}/${crypto.randomUUID()}.${fileName.split(".")[1]}`;
        if (!allowed || !(yield* storage.copy(payload.imageKey, imageKey))) {
          return yield* new NotFound({ message: "This picture doesn't exist." });
        }
        return { imageKey };
      }),
    });
  }),
);

export const ImageDownloadHandlers = HttpApiBuilder.group(
  Api,
  "imageFiles",
  Effect.fn(function* (handlers) {
    const storage = yield* ImageStorage;
    return handlers.handleRaw("download", ({ params }) =>
      Effect.gen(function* () {
        const image = yield* storage.get(`${params.storeId}/${params.fileName}`);
        if (!image) return yield* new NotFound({ message: "This picture doesn't exist." });
        return HttpServerResponse.fromWeb(
          new Response(image.body, {
            headers: {
              "Content-Type": image.contentType,
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          }),
        );
      }),
    );
  }),
);
