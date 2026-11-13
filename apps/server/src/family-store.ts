import { cleanUp, readRows } from "@lardon/recipes";
import { createRecipeStore } from "@lardon/recipes/tables";
import { Effect, Option, Schema } from "effect";
import type { CellOrUndefined, MergeableStore } from "tinybase";
import { createDurableObjectSqlStoragePersister } from "tinybase/persisters/persister-durable-object-sql-storage";
import { WsServerDurableObject } from "tinybase/synchronizers/synchronizer-ws-server-durable-object";

import { USER_HEADER } from "./family-stores";
import { ImageStorage, familyImagePrefix, unreferencedImageKeys } from "./image-storage";
import { allowsChange } from "./sync-rules";

const DAY_MS = 24 * 60 * 60 * 1000;

const decodeAccess = Schema.decodeUnknownOption(
  Schema.Struct({ context: Schema.Struct({ userId: Schema.String }) }),
);

export class FamilyStore extends WsServerDurableObject<Env> {
  declare store: MergeableStore;

  createPersister() {
    this.store = createRecipeStore();

    return createDurableObjectSqlStoragePersister(this.store, this.ctx.storage.sql, {
      mode: "fragmented",
    });
  }

  async authorize(familyId: string, request: Request) {
    const userId = request.headers.get(USER_HEADER);

    if (!userId) return undefined;
    this.ctx.storage.kv.put("familyId", familyId);

    if ((await this.ctx.storage.getAlarm()) === null) {
      await this.ctx.storage.setAlarm(Date.now() + DAY_MS);
    }

    return { context: { userId } };
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

  async alarm() {
    const familyId = this.ctx.storage.kv.get<string>("familyId");

    if (familyId === undefined) return;
    cleanUp(this.store);
    const recipes = readRows(this.store, "recipes");

    if (recipes.length > 0) {
      const referenced = new Set(
        recipes.flatMap((recipe) => (recipe.imageKey ? [recipe.imageKey] : [])),
      );

      const images = ImageStorage.fromR2(this.env.IMAGES);

      await Effect.runPromise(
        images
          .list(familyImagePrefix(familyId))
          .pipe(
            Effect.flatMap((listed) =>
              images.deleteMany(unreferencedImageKeys(listed, referenced, Date.now())),
            ),
          ),
      );
    }

    await this.ctx.storage.setAlarm(Date.now() + DAY_MS);
  }
}
