import { useQuery } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { ActivityIndicator, ScrollView, Text } from "react-native";

import { connectionQueries, ownProfileQuery } from "#/entities/profile";
import { useThemeColors } from "#/shared/lib";
import { EmptyState, GroupedRow, GroupedSection, KeyboardDoneButton } from "#/shared/ui";

import { ProfileForm } from "./profile-form";

export function EditProfileScreen() {
  const { background, foreground } = useThemeColors("background", "foreground");
  const profile = useQuery(ownProfileQuery);
  const blocked = useQuery({ ...connectionQueries.blocked, enabled: Boolean(profile.data) });

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
          title: "Edit profile",
        }}
      />
      {profile.isPending ? (
        <ActivityIndicator className="flex-1" />
      ) : profile.isError ? (
        <EmptyState
          icon="wifi.exclamationmark"
          title="Couldn't load your profile"
          description="Check your connection and try again."
          action={{ label: "Try again", icon: "arrow.clockwise", onPress: () => profile.refetch() }}
        />
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-16"
        >
          <ProfileForm profile={profile.data} />
          {profile.data && (
            <GroupedSection footer="Only followers you approve see the recipes you share with them.">
              <GroupedRow
                label="Blocked people"
                isFirst
                accessory="chevron"
                onPress={() => router.push("/edit-profile/blocked")}
              >
                {blocked.data && (
                  <Text className="text-title text-muted">{String(blocked.data.length)}</Text>
                )}
              </GroupedRow>
            </GroupedSection>
          )}
        </ScrollView>
      )}
      <KeyboardDoneButton />
    </>
  );
}
