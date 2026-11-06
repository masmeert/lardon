import { registerDevMenuItems } from "expo-dev-menu";
import { router } from "expo-router";
import { Platform } from "react-native";

export function registerStorybookDevMenuItem() {
  if (!__DEV__ || Platform.OS === "web" || process.env.EXPO_PUBLIC_STORYBOOK_ENABLED !== "true") {
    return;
  }

  void registerDevMenuItems([
    {
      name: "Open Storybook",
      callback() {
        router.push("/storybook");
      },
      shouldCollapse: true,
    },
  ]);
}
