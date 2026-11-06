import type { Session } from "@lardon/auth";
import type { Database } from "@lardon/db";

import type { ImageStore } from "./images/storage";

export type Context = {
  session: Session | null;
  db: Database;
  images: ImageStore;
};

export type AuthedContext = Context & { session: Session };
