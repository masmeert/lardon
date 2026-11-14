import { useQuery } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { ActivityIndicator } from "react-native";

import { connectionQueries, ownProfileQuery } from "#/entities/profile";
import { EmptyState } from "#/shared/ui";
import { FeedList } from "./feed-list";

export function DiscoverScreen() {
  const profile = useQuery(ownProfileQuery);
  const hasProfile = Boolean(profile.data);
  const following = useQuery({ ...connectionQueries.following, enabled: hasProfile });

  if (profile.isPending) return <ActivityIndicator className="flex-1" />;

  if (profile.isError) {
    return (
      <EmptyState
        icon="wifi.exclamationmark"
        title="Couldn't load Discover"
        description="Check your connection and try again."
        action={{ label: "Try again", icon: "arrow.clockwise", onPress: () => profile.refetch() }}
      />
    );
  }

  if (!profile.data) {
    return (
      <EmptyState
        icon="person.crop.circle.badge.plus"
        title="Choose a username"
        description="People you cook with find you by your username. Only people you approve see the recipes you share."
        action={{
          label: "Choose a username",
          icon: "at",
          onPress: () => router.push("/public-profile"),
        }}
      />
    );
  }

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="magnifyingglass"
          accessibilityLabel="Find people"
          onPress={() => router.push("/people/search")}
        />
      </Stack.Toolbar>
      <FeedList
        emptyState={
          following.data?.length === 0 ? (
            <EmptyState
              icon="person.2"
              title="Follow people you cook with"
              description="When they share a recipe with their followers, it shows up here."
              action={{
                label: "Find people",
                icon: "magnifyingglass",
                onPress: () => router.push("/people/search"),
              }}
            />
          ) : (
            <EmptyState
              icon="safari"
              title="Nothing shared yet"
              description="When people you follow share a recipe with their followers, it shows up here."
            />
          )
        }
      />
    </>
  );
}
