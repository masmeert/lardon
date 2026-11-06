import type { ImageStore } from "@lardon/api/images/storage";
import { createAuth as createConfiguredAuth } from "@lardon/auth";
import { type Database, createDb } from "@lardon/db";

import { ENV } from "./env.server";

export function getDb(): Database {
  return createDb(ENV);
}
export async function createAuth(database?: Database) {
  return createConfiguredAuth(ENV, database ?? (await getDb()));
}

export function r2ImageStore(bucket: R2Bucket): ImageStore {
  return {
    async put(key, data, contentType) {
      await bucket.put(key, data, { httpMetadata: { contentType } });
    },
    async get(key) {
      const object = await bucket.get(key);
      if (!object) return null;
      return {
        body: object.body,
        contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
        arrayBuffer: () => object.arrayBuffer(),
      };
    },
    async delete(keys) {
      if (keys.length > 0) await bucket.delete(keys);
    },
  };
}

export function getImageStore(): ImageStore {
  return r2ImageStore(ENV.IMAGES);
}
