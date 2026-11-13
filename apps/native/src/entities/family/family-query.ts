import { queryOptions } from "@tanstack/react-query";

import { requestApi } from "#/shared/api";

export function familyQuery(familyId: string) {
  return queryOptions({
    queryKey: ["families", familyId],
    queryFn: () => requestApi((client) => client.families.get({ params: { familyId } })),
  });
}
