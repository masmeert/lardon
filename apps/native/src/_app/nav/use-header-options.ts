import type { NativeStackNavigationOptions } from "expo-router";

import { useThemeColors } from "#/shared/lib";

export function useHeaderOptions() {
  const { foreground, background } = useThemeColors("foreground", "background");

  return function headerOptions({
    title = "",
    presentation = "card",
  }: {
    title?: string;
    presentation?: "card" | "modal" | "formSheet";
  }): NativeStackNavigationOptions {
    return {
      presentation,
      sheetAllowedDetents: presentation === "formSheet" ? "fitToContents" : undefined,
      headerShown: true,
      title,
      headerBackButtonDisplayMode: "minimal",
      headerTintColor: foreground,
      headerStyle: { backgroundColor: background },
      headerShadowVisible: false,
    };
  };
}
