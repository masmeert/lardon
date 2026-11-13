import type { NativeStackNavigationOptions } from "expo-router";

export const sheetOptions: NativeStackNavigationOptions = {
  presentation: "formSheet",
  sheetAllowedDetents: "fitToContents",
  sheetGrabberVisible: true,
  headerShown: true,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: "transparent" },
  contentStyle: { backgroundColor: "transparent" },
};
