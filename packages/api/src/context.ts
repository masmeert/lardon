import type { Session } from "@lardon/auth";
import type { Database } from "@lardon/db";

export type Context = {
  session: Session | null;
  db: Database;
};
