import { Alert, Pressable, ScrollView, View } from "react-native";
import { ActivityIndicator } from "react-native";

import { useSignOut } from "#/entities/family";
import { authClient } from "#/shared/auth";
import { GroupedRow, GroupedSection, InlineError } from "#/shared/ui";

export function SettingsScreen() {
  const { data: session } = authClient.useSession();
  const signOut = useSignOut();

  function confirmSignOut() {
    Alert.alert("Sign out?", "Your recipes stay in your account, ready when you sign back in.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut.mutate() },
    ]);
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-16">
      <GroupedSection title="Account">
        <GroupedRow
          label={session?.user.name || "Your account"}
          detail={session?.user.email}
          isFirst
        />
      </GroupedSection>
      <GroupedSection>
        <Pressable
          accessibilityRole="button"
          disabled={signOut.isPending}
          onPress={confirmSignOut}
          className="active:opacity-70"
        >
          <GroupedRow label="Sign out" tone="danger" isFirst>
            {signOut.isPending && <ActivityIndicator />}
          </GroupedRow>
        </Pressable>
      </GroupedSection>
      {signOut.isError && (
        <View className="items-start px-8 pt-3">
          <InlineError>Couldn't sign out. Check your connection and try again</InlineError>
        </View>
      )}
    </ScrollView>
  );
}
