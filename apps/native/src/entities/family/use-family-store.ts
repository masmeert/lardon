import type { MergeableStore, Store } from "tinybase";
import { useStore, useStores } from "tinybase/ui-react";

export function isMergeableStore(store: Store | undefined): store is MergeableStore {
  return store !== undefined && "getMergeableContent" in store;
}

export function useFamilyStore(familyId: string) {
  const store = useStore(familyId);

  return isMergeableStore(store) ? store : undefined;
}

export function useFamilyStores() {
  const stores = useStores();

  return function familyStore(familyId: string) {
    const store = stores[familyId];

    return isMergeableStore(store) ? store : undefined;
  };
}
