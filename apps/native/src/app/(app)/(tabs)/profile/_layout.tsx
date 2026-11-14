import { Stack } from "expo-router";

import { TabStack } from "#/_app/nav/tab-stack";
import { useThemeColors } from "#/shared/lib";

export default function ProfileLayout() {
  const { foreground } = useThemeColors("foreground");

  const options = {
    headerLargeTitleEnabled: true,
    headerTransparent: true,
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerTintColor: foreground,
    headerBackButtonDisplayMode: "minimal",
    scrollEdgeEffects: { top: "soft" },
  } as const;

  return (
    <TabStack title="Profile">
      <Stack.Screen name="settings" options={{ ...options, title: "Settings" }} />
      <Stack.Screen name="account" options={{ ...options, title: "Account" }} />
      <Stack.Screen name="family" options={{ ...options, title: "Family" }} />
      <Stack.Screen
        name="delete-account"
        options={{ ...options, title: "", headerLargeTitleEnabled: false }}
      />
    </TabStack>
  );
}
