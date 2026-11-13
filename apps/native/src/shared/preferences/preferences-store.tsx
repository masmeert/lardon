import { openDatabaseSync } from "expo-sqlite";
import { createStore } from "tinybase";
import { createExpoSqlitePersister } from "tinybase/persisters/persister-expo-sqlite";
import { useCreatePersister, useCreateStore, useProvideStore } from "tinybase/ui-react";

export function PreferencesStore() {
  const store = useCreateStore(createStore);

  useProvideStore("preferences", store);

  useCreatePersister(
    store,
    (store) => createExpoSqlitePersister(store, openDatabaseSync("preferences.db")),
    [],
    async (persister) => {
      await persister.load();
      await persister.startAutoSave();
    },
  );

  return null;
}
