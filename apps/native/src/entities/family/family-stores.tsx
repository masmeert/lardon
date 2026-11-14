import { useIsMutating, useQuery } from "@tanstack/react-query";

import { familiesQuery } from "./families-query";
import { FamilyStore } from "./family-store";
import { endSessionMutationKey } from "./end-session";

export function FamilyStores() {
  const { data: families = [] } = useQuery(familiesQuery);
  const isEndingSession = useIsMutating({ mutationKey: endSessionMutationKey }) > 0;

  if (isEndingSession) return null;

  return families.map((family) => <FamilyStore key={family.id} familyId={family.id} />);
}
