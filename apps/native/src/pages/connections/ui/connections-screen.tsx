import type { Connection } from "@lardon/api";
import { useQuery } from "@tanstack/react-query";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { type ConnectionList, PersonRow, connectionQueries } from "#/entities/profile";
import { confirmFollowChange, useFollowChange } from "#/features/follow-person";
import { useThemeColors } from "#/shared/lib";
import { Button, ButtonLabel, EmptyState, GroupedSection, InlineError } from "#/shared/ui";

const lists = {
  followers: {
    title: "Followers",
    empty: "No followers yet",
    description: "People you approve show up here. Invite people from Discover.",
  },
  following: {
    title: "Following",
    empty: "You don't follow anyone yet",
    description: "Find people by their username in Discover.",
  },
  blocked: {
    title: "Blocked",
    empty: "No one is blocked",
    description: "People you block can't find you or ask to follow you.",
  },
};

export function ConnectionsScreen() {
  const { list } = useLocalSearchParams<{ list: ConnectionList }>();
  const { background, foreground } = useThemeColors("background", "foreground");
  const connections = useQuery(connectionQueries[list]);
  const change = useFollowChange();
  const { title, empty, description } = lists[list];

  const people =
    list === "followers"
      ? (connections.data?.filter((entry) => entry.status === "approved") ?? [])
      : (connections.data ?? []);

  function action(person: Connection) {
    const userId = person.userId;

    if (list === "blocked") {
      return { label: "Unblock", onPress: () => change.mutate({ action: "unblock", userId }) };
    }

    if (list === "followers") {
      return {
        label: "Remove",
        onPress: () =>
          confirmFollowChange("removeFollower", person, () =>
            change.mutate({ action: "removeFollower", userId }),
          ),
      };
    }

    return person.status === "pending"
      ? { label: "Cancel", onPress: () => change.mutate({ action: "unfollow", userId }) }
      : {
          label: "Unfollow",
          onPress: () =>
            confirmFollowChange("unfollow", person, () =>
              change.mutate({ action: "unfollow", userId }),
            ),
        };
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerLargeTitleEnabled: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerLargeTitleShadowVisible: false,
          headerTintColor: foreground,
          headerBackButtonDisplayMode: "minimal",
          scrollEdgeEffects: { top: "soft" },
          contentStyle: { backgroundColor: background },
          title,
        }}
      />
      {connections.isPending ? (
        <ActivityIndicator className="flex-1" />
      ) : people.length === 0 ? (
        <EmptyState icon="person.2" title={empty} description={description} />
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-16">
          <GroupedSection>
            {people.map((person, index) => {
              const { label, onPress } = action(person);
              const error = change.errorFor(person.userId);

              return (
                <View key={person.userId}>
                  <PersonRow
                    person={person}
                    detail={person.status === "pending" ? "Requested" : undefined}
                    isFirst={index === 0}
                    onPress={() =>
                      router.push({
                        pathname: "/u/[username]",
                        params: { username: person.username },
                      })
                    }
                  >
                    <Button
                      variant="secondary"
                      size="md"
                      isLoading={change.isChanging(person.userId)}
                      onPress={onPress}
                    >
                      <ButtonLabel>{label}</ButtonLabel>
                    </Button>
                  </PersonRow>
                  {error && (
                    <View className="items-start px-4 pb-3">
                      <InlineError>{error}</InlineError>
                    </View>
                  )}
                </View>
              );
            })}
          </GroupedSection>
        </ScrollView>
      )}
    </>
  );
}
