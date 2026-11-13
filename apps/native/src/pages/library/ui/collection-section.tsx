import type { ReactNode } from "react";
import { Text, View } from "react-native";

export function CollectionSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <View className="gap-4 py-7">
      <View className="mx-5 gap-0.5 border-t border-hairline pt-7">
        <Text accessibilityRole="header" className="text-title font-semibold text-foreground">
          {title}
        </Text>
        <Text className="text-caption text-muted">{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}
