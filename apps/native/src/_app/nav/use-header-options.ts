import type { NativeStackNavigationOptions } from "expo-router";

import { useThemeColor } from "#/shared/lib";

export function useHeaderOptions() {
  const foregroundColor = useThemeColor("foreground");
  const backgroundColor = useThemeColor("background");

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
      headerTintColor: foregroundColor,
      headerStyle: { backgroundColor },
      headerShadowVisible: false,
    };
  };
}
