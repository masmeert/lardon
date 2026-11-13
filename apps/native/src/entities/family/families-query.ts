import { queryOptions } from "@tanstack/react-query";

import { requestApi } from "#/shared/api";

export const familiesQuery = queryOptions({
  queryKey: ["families"],
  queryFn: () => requestApi((client) => client.families.list()),
});
