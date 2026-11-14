import type { ProfileView } from "@lardon/api";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Text, View } from "react-native";

import { PersonAvatar, connectionQueries } from "#/entities/profile";
import { confirmFollowChange, type useFollowChange } from "#/features/follow-person";
import { iconSize, useThemeColors } from "#/shared/lib";
import { Button, ButtonLabel, Icon, InlineError } from "#/shared/ui";

import { ProfileStat } from "./profile-stat";

export function ProfileHeader({
  profile,
  change,
}: {
  profile: ProfileView;
  change: ReturnType<typeof useFollowChange>;
}) {
  const { accent } = useThemeColors("accent");
  const followers = useQuery({ ...connectionQueries.followers, enabled: profile.isSelf });
  const requestCount = followers.data?.filter((entry) => entry.status === "pending").length ?? 0;
  const name = profile.name || `@${profile.username}`;
  const isChanging = change.isChanging(profile.userId);
  const error = change.errorFor(profile.userId);

  function act(action: Parameters<typeof change.mutate>[0]["action"]) {
    change.mutate({ action, userId: profile.userId });
  }

  return (
    <View className="gap-4 px-4 pt-2 pb-5">
      <View className="flex-row items-center gap-4">
        <PersonAvatar person={profile} sizePt={84} cornerRadiusPt={24} />
        <View className="flex-1 gap-2.5">
          <View>
            <Text numberOfLines={2} className="text-headline font-bold text-foreground">
              {name}
            </Text>
            <Text numberOfLines={1} className="text-body text-muted">
              {`@${profile.username}`}
            </Text>
          </View>
          {profile.followerCount !== null && profile.followingCount !== null && (
            <View className="flex-row gap-5">
              <ProfileStat
                label={profile.followerCount === 1 ? "follower" : "followers"}
                value={profile.followerCount}
                onPress={profile.isSelf ? () => router.push("/edit-profile/followers") : undefined}
              />
              <ProfileStat
                label="following"
                value={profile.followingCount}
                onPress={profile.isSelf ? () => router.push("/edit-profile/following") : undefined}
              />
            </View>
          )}
        </View>
      </View>
      {profile.bio && <Text className="text-body text-foreground">{profile.bio}</Text>}
      {profile.isSelf ? (
        requestCount > 0 && (
          <Button variant="secondary" size="md" onPress={() => router.push("/follow-requests")}>
            <Icon name="person.badge.clock" size={iconSize.md} color={accent} />
            <ButtonLabel>
              {`${requestCount} follow ${requestCount === 1 ? "request" : "requests"}`}
            </ButtonLabel>
          </Button>
        )
      ) : profile.isBlocked ? (
        <Button variant="secondary" size="md" isLoading={isChanging} onPress={() => act("unblock")}>
          <ButtonLabel>Unblock</ButtonLabel>
        </Button>
      ) : profile.following === "approved" ? (
        <Button
          variant="secondary"
          size="md"
          isLoading={isChanging}
          onPress={() => confirmFollowChange("unfollow", profile, () => act("unfollow"))}
        >
          <ButtonLabel>Following</ButtonLabel>
        </Button>
      ) : profile.following === "pending" ? (
        <Button
          variant="secondary"
          size="md"
          isLoading={isChanging}
          onPress={() => act("unfollow")}
        >
          <ButtonLabel>Requested</ButtonLabel>
        </Button>
      ) : (
        <Button size="md" isLoading={isChanging} onPress={() => act("follow")}>
          <ButtonLabel>{profile.follower === "approved" ? "Follow back" : "Follow"}</ButtonLabel>
        </Button>
      )}
      {profile.follower === "pending" && !profile.isBlocked && !profile.isSelf && (
        <View style={{ borderCurve: "continuous" }} className="gap-3 rounded-card bg-paper p-4">
          <Text className="text-body text-foreground">{`${name} asked to follow you.`}</Text>
          <View className="flex-row gap-2">
            <Button size="md" isLoading={isChanging} onPress={() => act("approve")}>
              <ButtonLabel>Approve</ButtonLabel>
            </Button>
            <Button
              variant="secondary"
              size="md"
              isDisabled={isChanging}
              onPress={() => act("removeFollower")}
            >
              <ButtonLabel>Decline</ButtonLabel>
            </Button>
          </View>
        </View>
      )}
      {error && <InlineError>{error}</InlineError>}
    </View>
  );
}
