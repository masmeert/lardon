import type { MergeableStore, Store } from "tinybase";
import { useStore } from "tinybase/ui-react";

function isMergeableStore(store: Store | undefined): store is MergeableStore {
  return store !== undefined && "getMergeableContent" in store;
}

export function useFamilyStore(familyId: string) {
  const store = useStore(familyId);

  return isMergeableStore(store) ? store : undefined;
}
