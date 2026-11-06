import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import type { PropsWithChildren } from "react";
import { Platform } from "react-native";

export function TabStack({ title, children }: PropsWithChildren<{ title: string }>) {
  const foregroundColor = useThemeColor("foreground");
  const backgroundColor = useThemeColor("background");

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: Platform.OS === "ios",
        headerStyle: Platform.OS === "ios" ? undefined : { backgroundColor },
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerTintColor: foregroundColor,
        headerTitleStyle: { fontFamily: "HankenGrotesk_600SemiBold" },
        headerLargeTitleStyle: { fontFamily: "HankenGrotesk_700Bold" },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="index" options={{ title }} />
      {children}
    </Stack>
  );
}
