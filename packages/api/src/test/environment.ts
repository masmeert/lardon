import type { Session } from "@lardon/auth";
import { user } from "@lardon/db/schema/auth";
import { createTestDatabase } from "@lardon/db/testing";

import type { AuthedContext } from "../context";
import type { ImageStore } from "../images/storage";
import { appRouter } from "../routers";

export function memoryImageStore() {
  const objects = new Map<string, { data: Uint8Array; contentType: string }>();
  const store: ImageStore = {
    async put(key, data, contentType) {
      objects.set(key, { data: data.slice(), contentType });
    },
    async get(key) {
      const object = objects.get(key);
      if (!object) return null;
      return {
        body: new Blob([object.data.slice()]).stream(),
        contentType: object.contentType,
        arrayBuffer: async () => object.data.slice().buffer as ArrayBuffer,
      };
    },
    async delete(keys) {
      for (const key of keys) objects.delete(key);
    },
  };
  return { store, objects };
}

export async function createTestEnvironment() {
  const db = await createTestDatabase();
  const images = memoryImageStore();

  async function createUser(name: string) {
    const id = crypto.randomUUID();
    const email = `${name.toLowerCase()}-${id.slice(0, 8)}@example.com`;
    await db.insert(user).values({ id, name, email });
    const context: AuthedContext = {
      db,
      session: { user: { id, name, email }, session: { userId: id } } as unknown as Session,
      images: images.store,
    };
    return { id, context, api: appRouter.createCaller(context) };
  }

  return { db, images, createUser };
}

export const TINY_PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  ),
  (character) => character.charCodeAt(0),
);
