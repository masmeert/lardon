import { useQuery } from "@tanstack/react-query";
import { Predicate } from "effect";
import { Stack, router } from "expo-router";
import { ActivityIndicator, ScrollView, Share, View } from "react-native";

import { profileQuery } from "#/entities/profile";
import { useFollowChange } from "#/features/follow-person";
import { EmptyState } from "#/shared/ui";

import { ProfileGrid } from "./profile-grid";
import { ProfileHeader } from "./profile-header";
import { profileMenu } from "./profile-menu";

export function ProfileBody({
  username,
  showsSettings,
}: {
  username: string;
  showsSettings: boolean;
}) {
  const profile = useQuery(profileQuery(username.toLowerCase()));
  const change = useFollowChange();

  if (profile.isPending) return <ActivityIndicator className="flex-1" />;

  if (!profile.data) {
    return Predicate.isTagged(profile.error, "NotFound") ? (
      <EmptyState
        icon="person.crop.circle.badge.questionmark"
        title={`No one is @${username}`}
        description="Check the username with the person who shared it."
      />
    ) : (
      <EmptyState
        icon="wifi.exclamationmark"
        title="Couldn't load this profile"
        description="Check your connection and try again."
        action={{ label: "Try again", icon: "arrow.clockwise", onPress: () => profile.refetch() }}
      />
    );
  }

  const header = <ProfileHeader profile={profile.data} change={change} />;

  return (
    <>
      {profile.data.isSelf ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="square.and.arrow.up"
            accessibilityLabel="Invite people to follow you"
            onPress={() =>
              Share.share({
                message: `Follow me on Lardon: @${profile.data.username}\nlardon://u/${profile.data.username}`,
              })
            }
          />
          <Stack.Toolbar.Button
            icon="pencil"
            accessibilityLabel="Edit profile"
            onPress={() => router.push("/edit-profile")}
          />
          {showsSettings && (
            <Stack.Toolbar.Button
              icon="gearshape"
              accessibilityLabel="Settings"
              onPress={() => router.push("/profile/settings")}
            />
          )}
        </Stack.Toolbar>
      ) : (
        <Stack.Toolbar placement="right">
          {profileMenu({ profile: profile.data, change })}
        </Stack.Toolbar>
      )}
      {profile.data.isSelf || profile.data.following === "approved" ? (
        <ProfileGrid profile={profile.data} header={header} />
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-16">
          {header}
          <View className="h-72">
            <EmptyState
              icon="lock"
              title="Only for approved followers"
              description={
                profile.data.isBlocked
                  ? "You blocked this person. Unblock them to follow them again."
                  : profile.data.following === "pending"
                    ? "You asked to follow. You'll see their recipes once they approve you."
                    : "Follow to ask for access. You'll see their recipes once they approve you."
              }
            />
          </View>
        </ScrollView>
      )}
    </>
  );
}
