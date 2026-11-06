import type { Context as ApiContext } from "@lardon/api/context";
import type { Context as HonoContext } from "hono";

import { createAuth, getDb, getImageStore } from "./services";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions): Promise<ApiContext> {
  const db = await getDb();
  const session = await (
    await createAuth(db)
  ).api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    db,
    session,
    images: getImageStore(),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
