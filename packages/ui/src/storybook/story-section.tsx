import type { PropsWithChildren } from "react";
import { View } from "react-native";

import { cn } from "../class-names";
import { Text } from "../typography/text";

export function StorySection({
  title,
  rule,
  className,
  children,
}: PropsWithChildren<{ title: string; rule?: string; className?: string }>) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text variant="title">{title}</Text>
        {rule ? (
          <Text variant="caption" tone="muted">
            {rule}
          </Text>
        ) : null}
      </View>
      <View className={cn("gap-3", className)}>{children}</View>
    </View>
  );
}
