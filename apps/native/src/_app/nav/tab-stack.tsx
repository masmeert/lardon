import { Stack } from "expo-router";
import type { ReactNode } from "react";

import { useThemeColors } from "#/shared/lib";

export function TabStack({ title, children }: { title: string; children?: ReactNode }) {
  const { background, foreground } = useThemeColors("background", "foreground");

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title,
          headerLargeTitleEnabled: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerLargeTitleShadowVisible: false,
          headerTintColor: foreground,
          scrollEdgeEffects: { top: "soft" },
        }}
      />
      {children}
    </Stack>
  );
}
