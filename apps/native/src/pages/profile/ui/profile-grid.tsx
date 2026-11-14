import type { ProfileView } from "@lardon/api";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, RefreshControl, View, useWindowDimensions } from "react-native";

import { feedQuery } from "#/entities/recipe";
import { cn } from "#/shared/lib";
import { EmptyState, InlineError } from "#/shared/ui";

import { type ProfileTab, ProfileTabs } from "./profile-tabs";
import { RecipeTile } from "./recipe-tile";

export function ProfileGrid({ profile, header }: { profile: ProfileView; header: ReactElement }) {
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<ProfileTab>("recipes");
  const feed = useInfiniteQuery(feedQuery(profile.userId));
  const recipes = feed.data?.pages.flatMap((page) => page.recipes) ?? [];
  const tileSizePt = Math.floor((width - 32 - 12) / 3);

  return (
    <FlashList
      data={tab === "recipes" ? recipes : []}
      numColumns={3}
      keyExtractor={(published) => published.recipeId}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 64 }}
      refreshControl={
        <RefreshControl
          refreshing={feed.isRefetching && !feed.isFetchingNextPage}
          onRefresh={() => feed.refetch()}
        />
      }
      onEndReached={() => {
        if (tab === "recipes" && feed.hasNextPage && !feed.isFetchingNextPage) {
          void feed.fetchNextPage();
        }
      }}
      onEndReachedThreshold={1.5}
      ListHeaderComponent={
        <View className="-mx-4">
          {header}
          <ProfileTabs selected={tab} onSelect={setTab} />
          {tab === "recipes" && feed.isError && (
            <View className="items-start px-4 pb-3">
              <InlineError>Couldn't load these recipes. Pull down to try again.</InlineError>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        tab === "stats" ? null : feed.isPending ? (
          <ActivityIndicator className="py-10" />
        ) : feed.isError ? null : (
          <View className="h-72">
            <EmptyState
              icon="book"
              title="No recipes shared yet"
              description={
                profile.isSelf
                  ? "Turn on Followers in a recipe's Shared with menu to show it here."
                  : "Recipes they share with followers show up here."
              }
            />
          </View>
        )
      }
      ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator className="py-6" /> : null}
      renderItem={({ item, index }) => (
        <View
          className={cn("flex-1 pb-1.5", ["items-start", "items-center", "items-end"][index % 3])}
        >
          <RecipeTile published={item} sizePt={tileSizePt} />
        </View>
      )}
    />
  );
}
