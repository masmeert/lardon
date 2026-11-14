import type { FeedPage } from "@lardon/api";
import { type InfiniteData, infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { queryClient, requestApi } from "#/shared/api";

export function feedQuery(authorId?: string) {
  return infiniteQueryOptions({
    queryKey: ["feed", "list", authorId ?? "following"],
    queryFn: ({ pageParam }) =>
      requestApi((client) =>
        client.feed.list({ query: { cursor: pageParam || undefined, authorId } }),
      ),
    initialPageParam: "",
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function feedRecipeQuery(recipeId: string) {
  return queryOptions({
    queryKey: ["feed", "recipe", recipeId],
    queryFn: () => requestApi((client) => client.feed.get({ params: { recipeId } })),
    retry: false,
    initialData: () =>
      queryClient
        .getQueriesData<InfiniteData<FeedPage>>({ queryKey: ["feed", "list"] })
        .flatMap(([, data]) => data?.pages.flatMap((page) => page.recipes) ?? [])
        .find((published) => published.recipeId === recipeId),
    initialDataUpdatedAt: 0,
  });
}
