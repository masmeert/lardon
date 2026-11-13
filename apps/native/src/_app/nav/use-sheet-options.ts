import type { NativeStackNavigationOptions } from "expo-router";
import { useCSSVariable } from "uniwind";

export function useSheetOptions(): NativeStackNavigationOptions {
  return {
    presentation: "formSheet",
    sheetAllowedDetents: "fitToContents",
    sheetGrabberVisible: true,
    headerShown: true,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: "transparent" },
    headerTitleStyle: { fontFamily: String(useCSSVariable("--font-heading")) },
    contentStyle: { backgroundColor: "transparent" },
  };
}
