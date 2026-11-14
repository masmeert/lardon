import { Stack, useLocalSearchParams } from "expo-router";

import { useThemeColors } from "#/shared/lib";

import { ProfileBody } from "./profile-body";

export function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { background, foreground } = useThemeColors("background", "foreground");

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerTintColor: foreground,
          headerBackButtonDisplayMode: "minimal",
          scrollEdgeEffects: { top: "soft" },
          contentStyle: { backgroundColor: background },
          title: "",
        }}
      />
      <ProfileBody username={username} showsSettings={false} />
    </>
  );
}
