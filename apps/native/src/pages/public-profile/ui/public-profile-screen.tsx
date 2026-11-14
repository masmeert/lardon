import { useQuery } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { PersonAvatar, connectionQueries, ownProfileQuery } from "#/entities/profile";
import { authClient } from "#/shared/auth";
import { iconSize, useThemeColors } from "#/shared/lib";
import { EmptyState, GroupedRow, GroupedSection, Icon } from "#/shared/ui";

import { ProfileForm } from "./profile-form";

export function PublicProfileScreen() {
  const { background, foreground, muted } = useThemeColors("background", "foreground", "muted");
  const { data: session } = authClient.useSession();
  const profile = useQuery(ownProfileQuery);
  const hasProfile = Boolean(profile.data);
  const followers = useQuery({ ...connectionQueries.followers, enabled: hasProfile });
  const following = useQuery({ ...connectionQueries.following, enabled: hasProfile });
  const blocked = useQuery({ ...connectionQueries.blocked, enabled: hasProfile });
  const name = session?.user.name ?? "";

  const rows = [
    {
      label: "Follow requests",
      count: followers.data?.filter((entry) => entry.status === "pending").length,
      pathname: "/follow-requests",
    },
    {
      label: "Followers",
      count: followers.data?.filter((entry) => entry.status === "approved").length,
      pathname: "/public-profile/followers",
    },
    { label: "Following", count: following.data?.length, pathname: "/public-profile/following" },
    { label: "Blocked", count: blocked.data?.length, pathname: "/public-profile/blocked" },
  ] as const;

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
          title: "Public profile",
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
          <View className="flex-row items-center gap-4 px-6 pt-2">
            <PersonAvatar
              person={{
                name,
                username: profile.data?.username ?? "?",
                image: session?.user.image ?? null,
              }}
              sizePt={64}
            />
            <View className="flex-1 gap-0.5">
              <Text className="text-headline font-semibold text-foreground">
                {name || (profile.data ? `@${profile.data.username}` : "Your profile")}
              </Text>
              <Text className="text-caption text-muted">
                Your name and photo come from your account.
              </Text>
            </View>
          </View>
          <ProfileForm profile={profile.data} />
          {profile.data && (
            <GroupedSection title="People">
              {rows.map((row, index) => (
                <Pressable
                  key={row.label}
                  accessibilityRole="button"
                  onPress={() => router.push(row.pathname)}
                  className="active:opacity-70"
                >
                  <GroupedRow label={row.label} isFirst={index === 0}>
                    {row.count !== undefined && (
                      <Text className="text-body text-muted">{String(row.count)}</Text>
                    )}
                    <Icon name="chevron.right" size={iconSize.sm} color={muted} />
                  </GroupedRow>
                </Pressable>
              ))}
            </GroupedSection>
          )}
          <Text className="px-8 pt-3 text-caption text-muted">
            Nothing on Lardon is public. People find you only by your exact username, and only
            followers you approve see the recipes you share with followers.
          </Text>
        </ScrollView>
      )}
    </>
  );
}
