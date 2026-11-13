import { createRecipeStore } from "@lardon/recipes";
import { useQueryClient } from "@tanstack/react-query";
import { type SQLiteDatabase, deleteDatabaseAsync, openDatabaseSync } from "expo-sqlite";
import { useRef } from "react";
import { createExpoSqlitePersister } from "tinybase/persisters/persister-expo-sqlite";
import { createWsSynchronizer } from "tinybase/synchronizers/synchronizer-ws-client";
import {
  useCreateMergeableStore,
  useCreatePersister,
  useCreateSynchronizer,
  useProvideStore,
} from "tinybase/ui-react";

import { familiesQuery } from "./families-query";
import { familyDatabaseName } from "./family-database";
import { familySocket } from "./family-socket";

export function FamilyStore({ familyId }: { familyId: string }) {
  const queryClient = useQueryClient();
  const isRemoved = useRef(false);
  const database = useRef<SQLiteDatabase>(undefined);
  const store = useCreateMergeableStore(createRecipeStore);

  useProvideStore(familyId, store);

  useCreatePersister(
    store,
    (store) => {
      database.current = openDatabaseSync(familyDatabaseName(familyId));

      return createExpoSqlitePersister(store, database.current, "store");
    },
    [familyId],
    async (persister) => {
      await persister.load();
      await persister.startAutoSave();
    },
    [],
    () => {
      database.current?.closeSync();

      if (isRemoved.current) void deleteDatabaseAsync(familyDatabaseName(familyId));
    },
    [familyId],
  );

  useCreateSynchronizer(
    store,
    async (store) => {
      const synchronizer = await createWsSynchronizer(
        store,
        // SAFETY: TinyBase documents reconnecting WebSockets as compatible with its synchronizer, which only uses send, close, readyState and event listeners.
        familySocket(familyId, () => {
          isRemoved.current = true;
          void queryClient.invalidateQueries({ queryKey: familiesQuery.queryKey });
        }) as never,
        5,
      );

      await synchronizer.startSync();

      return synchronizer;
    },
    [familyId],
  );

  return null;
}
