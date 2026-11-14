import { useQuery } from "@tanstack/react-query";
import { setStringAsync } from "expo-clipboard";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { Stack, router } from "expo-router";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { familiesQuery, familyQuery } from "#/entities/family";
import { apiErrorMessage } from "#/shared/api";
import { authClient } from "#/shared/auth";
import { iconSize, useThemeColors } from "#/shared/lib";
import { Button, ButtonLabel, EmptyState, GroupedSection, Icon, InlineError } from "#/shared/ui";

import { shareInvite, useFamilyActions } from "../model/use-family-actions";

import { familyMenu } from "./family-menu";
import { MemberRow } from "./member-row";

export function FamilyScreen() {
  const { white } = useThemeColors("white");
  const { data: session } = authClient.useSession();
  const { data: families = [] } = useQuery(familiesQuery);
  const familyId = families.find((candidate) => !candidate.personal)?.id ?? "";
  const { data: family, error } = useQuery({ ...familyQuery(familyId), enabled: familyId !== "" });
  const { leave, removeMember, setRole, invite, revokeInvite } = useFamilyActions(familyId);
  const userId = session?.user.id;

  if (!family) {
    return error || familyId === "" ? (
      <EmptyState
        icon="person.2"
        title={familyId === "" ? "You're not in a family" : "Couldn't load your family"}
        description={
          familyId === ""
            ? "Create a family or join one with a code from Settings."
            : "Check your connection and try again."
        }
      />
    ) : (
      <ActivityIndicator className="flex-1" />
    );
  }

  const familyName = family.name;
  const isOwner = family.role === "owner";
  const otherMembers = family.members.filter((member) => member.userId !== userId);
  const latestInvite = family.invites.at(-1);

  const actionError = [
    { mutation: invite, fallback: "Couldn't create a code. Check your connection and try again." },
    {
      mutation: revokeInvite,
      fallback: "Couldn't revoke the code. Check your connection and try again.",
    },
    {
      mutation: removeMember,
      fallback: "Couldn't remove them. Check your connection and try again.",
    },
    {
      mutation: setRole,
      fallback: "Couldn't change their role. Check your connection and try again.",
    },
    {
      mutation: leave,
      fallback: "Couldn't leave the family. Check your connection and try again.",
    },
  ].find(({ mutation }) => mutation.error);

  const isBusy = revokeInvite.isPending || leave.isPending;

  function manage(member: { userId: string; name: string; role: "owner" | "member" }) {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: member.name,
        options: [
          member.role === "owner" ? "Make member" : "Make owner",
          "Remove from family",
          "Cancel",
        ],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) {
          setRole.mutate({
            userId: member.userId,
            role: member.role === "owner" ? "member" : "owner",
          });
        }

        if (index === 1) {
          Alert.alert(
            `Remove ${member.name} from “${familyName}”?`,
            "They lose the family's recipes on all their devices. Recipes they keep private stay theirs.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: () => removeMember.mutate(member.userId),
              },
            ],
          );
        }
      },
    );
  }

  function confirmLeave() {
    const [successor] = otherMembers;

    Alert.alert(
      `Leave “${familyName}”?`,
      successor
        ? [
            "Recipes you shared stay with the family. Your private recipes stay yours.",
            isOwner && !otherMembers.some((member) => member.role === "owner")
              ? `${successor.name} becomes the owner.`
              : undefined,
            "The family's recipes are removed from this device.",
          ]
            .filter(Boolean)
            .join("\n\n")
        : "You're its only member, so the family and its shared recipes are deleted. Your private recipes stay yours.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: successor ? "Leave" : "Leave and delete",
          style: "destructive",
          onPress: () => leave.mutate(undefined, { onSuccess: () => router.back() }),
        },
      ],
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: familyName }} />
      <Stack.Toolbar placement="right">
        {isBusy ? (
          <Stack.Toolbar.View>
            <ActivityIndicator />
          </Stack.Toolbar.View>
        ) : (
          familyMenu({
            canRename: isOwner,
            hasInvite: latestInvite !== undefined,
            canRevokeInvite: isOwner || latestInvite?.createdById === userId,
            onCopyInvite: () =>
              latestInvite &&
              void setStringAsync(latestInvite.code).then(() =>
                notificationAsync(NotificationFeedbackType.Success),
              ),
            onRevokeInvite: () =>
              latestInvite &&
              Alert.alert(
                "Revoke the invite code?",
                "Nobody new can join with it. Members stay in the family.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Revoke",
                    style: "destructive",
                    onPress: () => revokeInvite.mutate(latestInvite.code),
                  },
                ],
              ),
            onLeave: confirmLeave,
          })
        )}
      </Stack.Toolbar>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-16">
        <GroupedSection
          title={family.members.length === 1 ? "1 member" : `${family.members.length} members`}
          footer={
            isOwner && otherMembers.length > 0
              ? "Tap someone to make them an owner or remove them from the family."
              : undefined
          }
        >
          {family.members.map((member, index) => (
            <MemberRow
              key={member.userId}
              member={member}
              isMe={member.userId === userId}
              isFirst={index === 0}
              isPending={
                (removeMember.isPending && removeMember.variables === member.userId) ||
                (setRole.isPending && setRole.variables.userId === member.userId)
              }
              onPress={isOwner && member.userId !== userId ? () => manage(member) : undefined}
            />
          ))}
          <View className="pl-4">
            <View style={{ height: StyleSheet.hairlineWidth }} className="bg-hairline" />
          </View>
          <View className="p-2.5">
            <Button
              isLoading={invite.isPending}
              onPress={() =>
                latestInvite
                  ? void shareInvite(familyName, latestInvite.code)
                  : invite.mutate(familyName)
              }
            >
              <Icon name="plus.circle.fill" size={iconSize.lg} color={white} />
              <ButtonLabel>Invite someone</ButtonLabel>
            </Button>
          </View>
        </GroupedSection>
        {actionError?.mutation.error && (
          <View className="items-start px-8 pt-3">
            <InlineError>
              {apiErrorMessage(actionError.mutation.error, actionError.fallback)}
            </InlineError>
          </View>
        )}
      </ScrollView>
    </>
  );
}
