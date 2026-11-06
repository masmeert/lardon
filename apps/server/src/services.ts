import { createAuth as createConfiguredAuth } from "@lardon/auth";
import { type Database, createDb } from "@lardon/db";

import { ENV } from "./env.server";

export function getDb(): Database {
  return createDb(ENV);
}

export function createAuth(database: Database = getDb()) {
  return createConfiguredAuth(ENV, database);
}
