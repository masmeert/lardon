import type { Database as DrizzleDatabase } from "@lardon/db";
import { Context, Effect } from "effect";

export class Database extends Context.Service<
  Database,
  {
    readonly client: DrizzleDatabase;
    use<A>(query: (client: DrizzleDatabase) => Promise<A>): Effect.Effect<A>;
  }
>()("lardon/server/Database") {
  static make(client: DrizzleDatabase) {
    return Database.of({ client, use: (query) => Effect.promise(() => query(client)) });
  }
}
