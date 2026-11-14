import type { ReactNode } from "react";
import { Text, View } from "react-native";

export function RecipeSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View className="gap-3 px-4 pt-8">
      <View className="min-h-control-sm flex-row items-center justify-between gap-3 pl-1">
        <Text accessibilityRole="header" className="text-title font-semibold text-foreground">
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}
