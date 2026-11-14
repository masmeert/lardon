import { queryOptions } from "@tanstack/react-query";

import { requestApi } from "#/shared/api";

export const ownProfileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => (await requestApi((client) => client.profiles.me())).profile,
});

export function profileQuery(username: string) {
  return queryOptions({
    queryKey: ["profiles", username],
    queryFn: () => requestApi((client) => client.profiles.get({ params: { username } })),
    retry: false,
  });
}

export const connectionQueries = {
  followers: queryOptions({
    queryKey: ["follows", "followers"],
    queryFn: () => requestApi((client) => client.follows.followers()),
  }),
  following: queryOptions({
    queryKey: ["follows", "following"],
    queryFn: () => requestApi((client) => client.follows.following()),
  }),
  blocked: queryOptions({
    queryKey: ["follows", "blocked"],
    queryFn: () => requestApi((client) => client.follows.blocked()),
  }),
};

export type ConnectionList = keyof typeof connectionQueries;
