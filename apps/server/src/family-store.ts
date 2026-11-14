import { createDb } from "@lardon/db";
import { cleanUp, readRows } from "@lardon/recipes";
import { createRecipeStore } from "@lardon/recipes/tables";
import { Effect, Option, Schema } from "effect";
import type { CellOrUndefined, MergeableStore } from "tinybase";
import { createDurableObjectSqlStoragePersister } from "tinybase/persisters/persister-durable-object-sql-storage";
import { WsServerDurableObject } from "tinybase/synchronizers/synchronizer-ws-server-durable-object";

import { Database } from "./database";
import { USER_HEADER } from "./family-stores";
import { ImageStorage, familyImagePrefix, unreferencedImageKeys } from "./image-storage";
import { PUBLISH_DELAY_MS, familyPublications, reconcilePublications } from "./published-recipes";
import { allowsChange } from "./sync-rules";

const DAY_MS = 24 * 60 * 60 * 1000;

const PUBLISH_RETRY_MS = 60_000;

const publishedTables = new Set(["recipes", "ingredients", "steps"]);

type Job = "cleanUpAt" | "publishAt";

const decodeAccess = Schema.decodeUnknownOption(
  Schema.Struct({ context: Schema.Struct({ userId: Schema.String }) }),
);

export class FamilyStore extends WsServerDurableObject<Env> {
  declare store: MergeableStore;

  createPersister() {
    this.store = createRecipeStore();

    const persister = createDurableObjectSqlStoragePersister(this.store, this.ctx.storage.sql, {
      mode: "fragmented",
    });

    this.store.addDidFinishTransactionListener(() => {
      const [changedTables] = this.store.getTransactionChanges();

      if (
        persister.isAutoSaving() &&
        Object.keys(changedTables).some((tableId) => publishedTables.has(tableId)) &&
        this.ctx.storage.kv.get<number>("publishAt") === undefined
      ) {
        void this.schedule("publishAt", Date.now() + PUBLISH_DELAY_MS);
      }
    });

    return persister;
  }

  async authorize(familyId: string, request: Request) {
    const userId = request.headers.get(USER_HEADER);

    if (!userId) return undefined;
    this.ctx.storage.kv.put("familyId", familyId);

    if (this.ctx.storage.kv.get<number>("cleanUpAt") === undefined) {
      await this.schedule("cleanUpAt", (await this.ctx.storage.getAlarm()) ?? Date.now() + DAY_MS);
    }

    return { context: { userId } };
  }

  async schedule(job: Job, atMs: number) {
    this.ctx.storage.kv.put(job, atMs);

    const dueTimes = (["cleanUpAt", "publishAt"] as const).flatMap((pending) => {
      const dueMs = this.ctx.storage.kv.get<number>(pending);

      return dueMs === undefined ? [] : [dueMs];
    });

    await this.ctx.storage.setAlarm(Math.min(atMs, ...dueTimes));
  }

  async jobs() {
    return {
      cleanUpAt: this.ctx.storage.kv.get<number>("cleanUpAt"),
      publishAt: this.ctx.storage.kv.get<number>("publishAt"),
      alarmAt: await this.ctx.storage.getAlarm(),
    };
  }

  async publish() {
    const familyId = this.ctx.storage.kv.get<string>("familyId");
    const publications = familyPublications(this.store.getTables());

    if (
      familyId === undefined ||
      (publications.length === 0 && !this.ctx.storage.kv.get<boolean>("hasPublications"))
    ) {
      return;
    }

    const published = await Effect.runPromise(
      reconcilePublications(familyId, publications).pipe(
        Effect.provideService(Database, Database.make(createDb(this.env))),
      ),
    );

    this.ctx.storage.kv.put("hasPublications", published > 0);
  }

  canWriteCell(
    _familyId: string,
    tableId: string,
    rowId: string,
    cellId: string,
    cell: CellOrUndefined,
    context: Record<string, string> | undefined,
  ) {
    return Option.exists(decodeAccess({ context }), (access) =>
      allowsChange(this.store, access.context.userId, { tableId, rowId, cellId, cell }),
    );
  }

  canWriteValue() {
    return false;
  }

  disconnect(userId: string) {
    for (const socket of this.ctx.getWebSockets()) {
      if (
        Option.exists(
          decodeAccess(socket.deserializeAttachment()),
          (access) => access.context.userId === userId,
        )
      ) {
        socket.close(4403, "You're no longer a member of this family.");
      }
    }
  }

  async destroy() {
    for (const socket of this.ctx.getWebSockets()) {
      socket.close(4404, "This family was deleted.");
    }

    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  async cleanUp(nowMs: number) {
    const familyId = this.ctx.storage.kv.get<string>("familyId");

    if (familyId === undefined) return;
    cleanUp(this.store);
    const recipes = readRows(this.store.getTables(), "recipes");

    if (recipes.length === 0) return;

    const referenced = new Set(
      recipes.flatMap((recipe) => (recipe.imageKey ? [recipe.imageKey] : [])),
    );

    const images = ImageStorage.fromR2(this.env.IMAGES);

    await Effect.runPromise(
      images
        .list(familyImagePrefix(familyId))
        .pipe(
          Effect.flatMap((listed) =>
            images.deleteMany(unreferencedImageKeys(listed, referenced, nowMs)),
          ),
        ),
    );
  }

  async alarm() {
    const nowMs = Date.now();
    const isCleanUpDue = (this.ctx.storage.kv.get<number>("cleanUpAt") ?? nowMs) <= nowMs;

    if (isCleanUpDue) await this.cleanUp(nowMs);

    if (isCleanUpDue || (this.ctx.storage.kv.get<number>("publishAt") ?? Infinity) <= nowMs) {
      this.ctx.storage.kv.delete("publishAt");
      await this.publish().catch(() => this.schedule("publishAt", nowMs + PUBLISH_RETRY_MS));
    }

    await this.schedule(
      "cleanUpAt",
      isCleanUpDue ? nowMs + DAY_MS : (this.ctx.storage.kv.get<number>("cleanUpAt") ?? nowMs),
    );
  }
}
