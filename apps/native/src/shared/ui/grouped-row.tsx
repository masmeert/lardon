import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { cn } from "#/shared/lib";

export function GroupedRow({
  label,
  detail,
  tone = "default",
  size = "md",
  isFirst,
  children,
}: {
  label: string;
  detail?: string;
  tone?: "default" | "danger";
  size?: "md" | "lg";
  isFirst?: boolean;
  children?: ReactNode;
}) {
  return (
    <View className="pl-4">
      {!isFirst && <View style={{ height: StyleSheet.hairlineWidth }} className="bg-hairline" />}
      <View
        className={cn(
          "flex-row items-center gap-3 py-2.5 pr-4",
          size === "md" ? "min-h-11" : "min-h-13",
        )}
      >
        <View className="flex-1 gap-0.5">
          <Text
            numberOfLines={1}
            className={cn("text-title", tone === "danger" ? "text-danger" : "text-foreground")}
          >
            {label}
          </Text>
          {detail && (
            <Text numberOfLines={1} className="text-caption text-muted">
              {detail}
            </Text>
          )}
        </View>
        {children}
      </View>
    </View>
  );
}
