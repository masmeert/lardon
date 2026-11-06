import { Stack } from "expo-router";
import { Platform } from "react-native";

import { TabStack } from "@/components/tab-stack";

export default function SettingsLayout() {
  return (
    <TabStack title="Settings">
      {["profile", "delete-account"].map((name) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: "fitToContents",
            sheetGrabberVisible: true,
            headerShown: false,
            contentStyle: Platform.OS === "ios" ? { backgroundColor: "transparent" } : undefined,
          }}
        />
      ))}
    </TabStack>
  );
}
