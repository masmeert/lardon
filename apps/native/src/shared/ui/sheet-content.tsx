import { Stack, router } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import type { ReactNode } from "react";
import { View } from "react-native";

export function SheetContent({ className, children }: { className: string; children: ReactNode }) {
  return (
    <View style={{ paddingTop: useHeaderHeight() }} className={className}>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" accessibilityLabel="Close" onPress={router.back} />
      </Stack.Toolbar>
      {children}
    </View>
  );
}
