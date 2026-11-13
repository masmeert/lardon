import { Stack } from "expo-router";
import type { ReactNode } from "react";
import { useCSSVariable } from "uniwind";

import { useThemeColors } from "#/shared/lib";

export function TabStack({ title, children }: { title: string; children?: ReactNode }) {
  const { background, foreground } = useThemeColors("background", "foreground");
  const headingFont = String(useCSSVariable("--font-heading"));

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: background },
        headerTitleStyle: { fontFamily: headingFont },
        headerLargeTitleStyle: { fontFamily: headingFont },
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
