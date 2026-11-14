import type { FamilyDetails } from "@lardon/api";
import { useQueryClient } from "@tanstack/react-query";

import { familiesQuery, familyQuery } from "#/entities/family";

export function useStoreFamily() {
  const queryClient = useQueryClient();

  return async function storeFamily(family: FamilyDetails) {
    queryClient.setQueryData(familyQuery(family.id).queryKey, family);
    await queryClient.invalidateQueries({ queryKey: familiesQuery.queryKey, exact: true });
  };
}
