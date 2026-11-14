import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";

import { feedQuery } from "#/entities/recipe";
import { EmptyState, InlineError } from "#/shared/ui";

import { FeedCard } from "./feed-card/feed-card";

export function FeedList({
  authorId,
  header,
  emptyState,
}: {
  authorId?: string;
  header?: ReactElement;
  emptyState: ReactElement;
}) {
  const feed = useInfiniteQuery(feedQuery(authorId));
  const recipes = feed.data?.pages.flatMap((page) => page.recipes) ?? [];

  if (feed.isPending) return <ActivityIndicator className="flex-1" />;

  if (feed.isError && !feed.data) {
    return (
      <EmptyState
        icon="wifi.exclamationmark"
        title="Couldn't load these recipes"
        description="Check your connection and try again."
        action={{ label: "Try again", icon: "arrow.clockwise", onPress: () => feed.refetch() }}
      />
    );
  }

  if (recipes.length === 0 && !header) return emptyState;

  return (
    <FlashList
      data={recipes}
      keyExtractor={(published) => published.recipeId}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: 64 }}
      refreshControl={
        <RefreshControl
          refreshing={feed.isRefetching && !feed.isFetchingNextPage}
          onRefresh={() => feed.refetch()}
        />
      }
      onEndReached={() => {
        if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
      }}
      onEndReachedThreshold={1.5}
      ListHeaderComponent={
        <>
          {header}
          {feed.isRefetchError && (
            <View className="items-center px-4 pt-2">
              <InlineError>
                Couldn't refresh. Check your connection and pull to try again.
              </InlineError>
            </View>
          )}
        </>
      }
      ItemSeparatorComponent={() => (
        <View style={{ height: StyleSheet.hairlineWidth }} className="mx-4 bg-muted/30" />
      )}
      ListEmptyComponent={<View className="h-80">{emptyState}</View>}
      ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator className="py-6" /> : null}
      renderItem={({ item }) => <FeedCard published={item} showsAuthor={authorId === undefined} />}
    />
  );
}
