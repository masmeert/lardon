import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import type { Database } from "./index";
import { relations } from "./relations";

export async function createTestDatabase(): Promise<Database> {
  const url = `file:${join(mkdtempSync(join(tmpdir(), "lardon-test-")), "test.db")}`;

  const migrator = createClient({ url });
  await migrate(drizzle({ client: migrator }), {
    migrationsFolder: fileURLToPath(new URL("./migrations", import.meta.url).href),
  });
  migrator.close();

  const client = createClient({ url });
  await client.execute("PRAGMA foreign_keys = ON");
  return drizzle({ client, relations }) as unknown as Database;
}
