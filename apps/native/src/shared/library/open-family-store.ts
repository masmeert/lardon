import { createRecipeStore } from "@lardon/recipes";
import { deleteDatabaseAsync, openDatabaseSync } from "expo-sqlite";
import { createExpoSqlitePersister } from "tinybase/persisters/persister-expo-sqlite";

import { syncFamily } from "./sync-family";

function familyDatabaseName(familyId: string) {
  return `family-${familyId}.db`;
}

export function openFamilyStore(familyId: string, onRemoved: () => void) {
  const store = createRecipeStore();
  const database = openDatabaseSync(familyDatabaseName(familyId));
  const persister = createExpoSqlitePersister(store, database, "store");
  let stopSync: (() => void) | undefined;
  let isClosed = false;

  const ready = persister
    .load()
    .then(() => persister.startAutoSave())
    .then(() => {
      if (!isClosed) stopSync = syncFamily(store, familyId, onRemoved);
    });

  return {
    store,
    async close({ isErasing }: { isErasing: boolean }) {
      isClosed = true;
      stopSync?.();
      await ready.catch(() => undefined);
      await persister.destroy();
      database.closeSync();

      if (isErasing) await deleteDatabaseAsync(familyDatabaseName(familyId));
    },
  };
}

export type FamilyStore = ReturnType<typeof openFamilyStore>;
