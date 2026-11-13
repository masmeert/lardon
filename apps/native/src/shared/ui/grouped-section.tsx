import type { ReactNode } from "react";
import { Text, View } from "react-native";

export function GroupedSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="gap-2 px-4 pt-6">
      {title && (
        <Text accessibilityRole="header" className="pl-4 text-caption text-muted">
          {title}
        </Text>
      )}
      <View style={{ borderCurve: "continuous" }} className="overflow-hidden rounded-card bg-paper">
        {children}
      </View>
    </View>
  );
}
