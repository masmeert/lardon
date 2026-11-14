import { useQuery } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { PersonAvatar, connectionQueries, ownProfileQuery } from "#/entities/profile";
import { authClient } from "#/shared/auth";
import { useThemeColors } from "#/shared/lib";
import { EmptyState, GroupedRow, GroupedSection, KeyboardDoneButton } from "#/shared/ui";

import { ProfileForm } from "./profile-form";

export function EditProfileScreen() {
  const { background, foreground } = useThemeColors("background", "foreground");
  const { data: session } = authClient.useSession();
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
          automaticallyAdjustKeyboardInsets
          contentContainerClassName="pb-16"
        >
          <View className="items-center pt-2">
            <PersonAvatar
              person={{
                name: session?.user.name ?? "",
                username: profile.data?.username ?? "?",
                image: session?.user.image ?? null,
              }}
              sizePt={84}
              cornerRadiusPt={24}
            />
          </View>
          <ProfileForm profile={profile.data} />
          {profile.data ? (
            <GroupedSection
              title="Privacy"
              footer="Nothing on Lardon is public. People find you only by your exact username, and only followers you approve see the recipes you share with followers."
            >
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
          ) : (
            <Text className="px-8 pt-4 text-caption text-muted">
              Nothing on Lardon is public. People find you only by your exact username, and only
              followers you approve see the recipes you share with followers.
            </Text>
          )}
        </ScrollView>
      )}
      <KeyboardDoneButton />
    </>
  );
}
