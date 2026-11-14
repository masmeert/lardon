import { router } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

import { MemberAvatar, useSignOut } from "#/entities/family";
import { authClient } from "#/shared/auth";
import { iconSize, useThemeColors } from "#/shared/lib";
import { GroupedRow, GroupedSection, Icon, InlineError } from "#/shared/ui";

export function AccountScreen() {
  const { data: session } = authClient.useSession();
  const signOut = useSignOut();
  const { foreground, danger } = useThemeColors("foreground", "danger");

  if (!session) return null;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-16">
      <View className="items-center gap-3 px-4 pt-4">
        <MemberAvatar member={session.user} sizePt={96} />
        <Text className="text-headline font-semibold text-foreground">
          {session.user.name || session.user.email}
        </Text>
      </View>
      <GroupedSection>
        <GroupedRow label="Email" isFirst>
          <Text numberOfLines={1} className="shrink text-title text-muted">
            {session.user.email}
          </Text>
        </GroupedRow>
      </GroupedSection>
      <GroupedSection>
        <GroupedRow
          label="Sign out"
          isFirst
          leading={
            <View className="w-5 items-center">
              <Icon
                name="rectangle.portrait.and.arrow.right"
                size={iconSize.md}
                color={foreground}
              />
            </View>
          }
          isDisabled={signOut.isPending}
          onPress={() =>
            Alert.alert(
              "Sign out?",
              "Your recipes stay in your account, ready when you sign back in.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Sign out", style: "destructive", onPress: () => signOut.mutate() },
              ],
            )
          }
        >
          {signOut.isPending && <ActivityIndicator />}
        </GroupedRow>
        <GroupedRow
          label="Delete account"
          tone="danger"
          leading={
            <View className="w-5 items-center">
              <Icon name="trash" size={iconSize.md} color={danger} />
            </View>
          }
          onPress={() => router.push("/profile/delete-account")}
        />
      </GroupedSection>
      {signOut.isError && (
        <View className="items-start px-8 pt-3">
          <InlineError>Couldn't sign out. Check your connection and try again</InlineError>
        </View>
      )}
    </ScrollView>
  );
}
