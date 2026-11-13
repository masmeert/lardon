import { useIsMutating, useQuery } from "@tanstack/react-query";

import { familiesQuery } from "./families-query";
import { FamilyStore } from "./family-store";
import { signOutMutationKey } from "./sign-out";

export function FamilyStores() {
  const { data: families = [] } = useQuery(familiesQuery);
  const isSigningOut = useIsMutating({ mutationKey: signOutMutationKey }) > 0;

  if (isSigningOut) return null;

  return families.map((family) => <FamilyStore key={family.id} familyId={family.id} />);
}
