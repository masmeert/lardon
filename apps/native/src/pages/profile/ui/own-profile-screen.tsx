import { useQuery } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { ActivityIndicator } from "react-native";

import { ownProfileQuery } from "#/entities/profile";
import { EmptyState } from "#/shared/ui";

import { ProfileBody } from "./profile-body";

export function OwnProfileScreen() {
  const profile = useQuery(ownProfileQuery);

  return (
    <>
      <Stack.Screen options={{ title: "", headerLargeTitleEnabled: false }} />
      {profile.isPending ? (
        <ActivityIndicator className="flex-1" />
      ) : profile.data ? (
        <ProfileBody username={profile.data.username} showsSettings />
      ) : (
        <>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              icon="gearshape"
              accessibilityLabel="Settings"
              onPress={() => router.push("/profile/settings")}
            />
          </Stack.Toolbar>
          {profile.isError ? (
            <EmptyState
              icon="wifi.exclamationmark"
              title="Couldn't load your profile"
              description="Check your connection and try again."
              action={{
                label: "Try again",
                icon: "arrow.clockwise",
                onPress: () => profile.refetch(),
              }}
            />
          ) : (
            <EmptyState
              icon="person.crop.circle.badge.plus"
              title="Choose a username"
              description="People you cook with find you by your username. Only people you approve see the recipes you share."
              action={{
                label: "Choose a username",
                icon: "at",
                onPress: () => router.push("/edit-profile"),
              }}
            />
          )}
        </>
      )}
    </>
  );
}
