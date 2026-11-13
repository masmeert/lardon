import { useRef, useSyncExternalStore } from "react";
import { useStores } from "tinybase/ui-react";

import type { FamilyTables } from "./model/library";

export function useFamilyTables(familyIds: readonly string[]) {
  const stores = useStores();

  const familyStores = familyIds.flatMap((familyId) => {
    const store = stores[familyId];

    return store ? [{ familyId, store }] : [];
  });

  const snapshot = useRef<{ key: string; familyTables: readonly FamilyTables[] }>(undefined);
  const changeCount = useRef(0);

  return useSyncExternalStore(
    (onChange) => {
      const listeners = familyStores.map(({ store }) => ({
        store,
        listenerId: store.addTablesListener(() => {
          changeCount.current += 1;
          onChange();
        }),
      }));

      return () => {
        for (const { store, listenerId } of listeners) store.delListener(listenerId);
      };
    },
    () => {
      const key = `${familyStores.map(({ familyId }) => familyId).join(",")}:${changeCount.current}`;

      if (snapshot.current?.key !== key) {
        snapshot.current = {
          key,
          familyTables: familyStores.map(({ familyId, store }) => ({
            familyId,
            tables: store.getTables(),
          })),
        };
      }

      return snapshot.current.familyTables;
    },
  );
}
