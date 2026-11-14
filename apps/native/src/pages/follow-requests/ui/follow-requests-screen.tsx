import { useQuery } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { PersonRow, connectionQueries } from "#/entities/profile";
import { useFollowChange } from "#/features/follow-person";
import { useThemeColors } from "#/shared/lib";
import { Button, ButtonLabel, EmptyState, GroupedSection, Icon, InlineError } from "#/shared/ui";

export function FollowRequestsScreen() {
  const { background, foreground } = useThemeColors("background", "foreground");
  const followers = useQuery(connectionQueries.followers);
  const change = useFollowChange();
  const requests = followers.data?.filter((entry) => entry.status === "pending") ?? [];

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
          title: "Follow requests",
        }}
      />
      {followers.isPending ? (
        <ActivityIndicator className="flex-1" />
      ) : requests.length === 0 ? (
        <EmptyState
          icon="person.2"
          title="No requests"
          description="When someone asks to follow you, you'll approve them here."
        />
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-16">
          <Text className="px-8 pt-2 text-caption text-muted">
            People you approve see the recipes you share with followers.
          </Text>
          <GroupedSection>
            {requests.map((request, index) => (
              <View key={request.userId}>
                <PersonRow
                  person={request}
                  isFirst={index === 0}
                  onPress={() =>
                    router.push({
                      pathname: "/u/[username]",
                      params: { username: request.username },
                    })
                  }
                >
                  <View className="flex-row gap-2">
                    <Button
                      size="md"
                      isIconOnly
                      accessibilityLabel={`Decline ${request.name}`}
                      variant="secondary"
                      isDisabled={change.isChanging(request.userId)}
                      onPress={() =>
                        change.mutate({ action: "removeFollower", userId: request.userId })
                      }
                    >
                      <Icon name="xmark" color={foreground} />
                    </Button>
                    <Button
                      size="md"
                      isLoading={change.isChanging(request.userId)}
                      onPress={() => change.mutate({ action: "approve", userId: request.userId })}
                    >
                      <ButtonLabel>Approve</ButtonLabel>
                    </Button>
                  </View>
                </PersonRow>
                {change.errorFor(request.userId) && (
                  <View className="items-start px-4 pb-3">
                    <InlineError>{change.errorFor(request.userId) ?? ""}</InlineError>
                  </View>
                )}
              </View>
            ))}
          </GroupedSection>
        </ScrollView>
      )}
    </>
  );
}
