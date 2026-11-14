import { useQuery } from "@tanstack/react-query";
import { Predicate } from "effect";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator } from "react-native";

import { feedRecipeQuery } from "#/entities/recipe";
import { useThemeColors } from "#/shared/lib";
import { EmptyState } from "#/shared/ui";

import { FeedRecipeScreen } from "./feed-recipe-screen";

export function FeedRecipeRoute() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const { background, foreground } = useThemeColors("background", "foreground");
  const published = useQuery(feedRecipeQuery(recipeId));

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerTintColor: foreground,
          headerBackButtonDisplayMode: "minimal",
          scrollEdgeEffects: { top: "soft" },
          contentStyle: { backgroundColor: background },
          title: "",
        }}
      />
      {published.data ? (
        <FeedRecipeScreen published={published.data} />
      ) : published.isPending ? (
        <ActivityIndicator className="flex-1" />
      ) : Predicate.isTagged(published.error, "NotFound") ? (
        <EmptyState
          icon="lock"
          title="This recipe isn't shared with you"
          description="Its author made it private, deleted it, or no longer shares with you."
        />
      ) : (
        <EmptyState
          icon="wifi.exclamationmark"
          title="Couldn't load this recipe"
          description="Check your connection and try again."
          action={{
            label: "Try again",
            icon: "arrow.clockwise",
            onPress: () => published.refetch(),
          }}
        />
      )}
    </>
  );
}
