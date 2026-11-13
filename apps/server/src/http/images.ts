import { Api, CurrentUser, InvalidRequest, MAX_IMAGE_BYTES, NotFound } from "@lardon/api";
import { Effect } from "effect";
import { HttpServerResponse } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";

import { Families, missingFamily } from "../families";
import { ImageStorage, familyImagePrefix } from "../image-storage";

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

function sniffImageType(bytes: Uint8Array) {
  return IMAGE_SIGNATURES.find(
    (signature) =>
      signature.bytes.every((byte, index) => bytes[signature.offset + index] === byte) &&
      (signature.contentType !== "image/webp" ||
        [0x52, 0x49, 0x46, 0x46].every((byte, index) => bytes[index] === byte)),
  );
}

const missingPicture = new NotFound({ message: "This picture doesn't exist." });

export const ImagesHandlers = HttpApiBuilder.group(
  Api,
  "images",
  Effect.fn(function* (handlers) {
    const families = yield* Families;
    const storage = yield* ImageStorage;

    const requireMember = Effect.fn("images.requireMember")(function* (
      familyId: string,
      notFound: NotFound,
    ) {
      const user = yield* CurrentUser;

      if (!(yield* families.isMember(user.id, familyId))) return yield* notFound;
    });

    return handlers
      .handle(
        "upload",
        Effect.fn("images.upload")(function* ({ params, payload }) {
          yield* requireMember(params.familyId, missingFamily);

          if (payload.byteLength === 0) {
            return yield* new InvalidRequest({
              message: "The picture is empty. Choose another one.",
            });
          }

          if (payload.byteLength > MAX_IMAGE_BYTES) {
            return yield* new InvalidRequest({
              message: "The picture is larger than 5 MB. Choose a smaller one or resize it.",
            });
          }

          const imageType = sniffImageType(payload);

          if (!imageType) {
            return yield* new InvalidRequest({
              message: "The picture must be a JPEG, PNG or WebP file.",
            });
          }

          const imageKey = `${crypto.randomUUID()}.${imageType.extension}`;
          yield* storage.put(
            `${familyImagePrefix(params.familyId)}${imageKey}`,
            payload,
            imageType.contentType,
          );

          return { imageKey };
        }),
      )
      .handle(
        "copy",
        Effect.fn("images.copy")(function* ({ params, payload }) {
          yield* requireMember(params.familyId, missingFamily);
          yield* requireMember(payload.sourceFamilyId, missingPicture);
          const imageKey = `${crypto.randomUUID()}.${payload.imageKey.split(".")[1]}`;

          const copied = yield* storage.copy(
            `${familyImagePrefix(payload.sourceFamilyId)}${payload.imageKey}`,
            `${familyImagePrefix(params.familyId)}${imageKey}`,
          );

          if (!copied) return yield* missingPicture;

          return { imageKey };
        }),
      )
      .handleRaw("download", ({ params }) =>
        Effect.gen(function* () {
          yield* requireMember(params.familyId, missingPicture);

          const image = yield* storage.get(
            `${familyImagePrefix(params.familyId)}${params.imageKey}`,
          );

          if (!image) return yield* missingPicture;

          return HttpServerResponse.fromWeb(
            new Response(image.body, {
              headers: {
                "Content-Type": image.contentType,
                "Cache-Control": "private, max-age=31536000, immutable",
              },
            }),
          );
        }),
      );
  }),
);
