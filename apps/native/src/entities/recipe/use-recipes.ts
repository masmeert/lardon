import { everyRecipe, recipeList } from "@lardon/recipes";
import { useRef, useSyncExternalStore } from "react";
import type { Tables } from "tinybase";
import { useStores } from "tinybase/ui-react";

function useFamilyTables(familyIds: readonly string[]) {
  const stores = useStores();

  const familyStores = familyIds.flatMap((familyId) => {
    const store = stores[familyId];

    return store ? [{ familyId, store }] : [];
  });

  const snapshot = useRef<{ key: string; tables: readonly { familyId: string; tables: Tables }[] }>(
    undefined,
  );

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
          tables: familyStores.map(({ familyId, store }) => ({
            familyId,
            tables: store.getTables(),
          })),
        };
      }

      return snapshot.current.tables;
    },
  );
}

export function useRecipes(familyIds: readonly string[], search: string) {
  return useFamilyTables(familyIds)
    .flatMap(({ familyId, tables }) =>
      recipeList(tables, { ...everyRecipe, search }).map((recipe) => ({ ...recipe, familyId })),
    )
    .sort((first, second) => second.updatedAt - first.updatedAt);
}
