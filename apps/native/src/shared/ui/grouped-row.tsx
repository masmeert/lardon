import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { cn, iconSize, useThemeColors } from "#/shared/lib";

import { Icon } from "./icon";

export function GroupedRow({
  label,
  detail,
  tone = "default",
  size = "lg",
  isFirst,
  leading,
  accessory,
  accessibilityHint,
  isDisabled = false,
  onPress,
  children,
}: {
  label: string;
  detail?: string;
  tone?: "default" | "accent" | "danger";
  size?: "md" | "lg";
  isFirst?: boolean;
  leading?: ReactNode;
  accessory?: "chevron" | "external";
  accessibilityHint?: string;
  isDisabled?: boolean;
  onPress?: () => void;
  children?: ReactNode;
}) {
  const { muted } = useThemeColors("muted");

  const row = (
    <View className="pl-4">
      {!isFirst && <View style={{ height: StyleSheet.hairlineWidth }} className="bg-hairline" />}
      <View
        className={cn(
          "flex-row items-center gap-3 py-2.5 pr-4",
          size === "md" ? "min-h-11" : "min-h-13",
        )}
      >
        {leading}
        <View className="flex-1 gap-0.5">
          <Text
            numberOfLines={1}
            className={cn(
              "text-title",
              { default: "text-foreground", accent: "text-accent", danger: "text-danger" }[tone],
            )}
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
        {accessory && (
          <Icon
            name={accessory === "chevron" ? "chevron.right" : "arrow.up.right"}
            size={iconSize.sm}
            color={muted}
          />
        )}
      </View>
    </View>
  );

  if (!onPress) return row;

  return (
    <Pressable
      accessibilityRole={accessory === "external" ? "link" : "button"}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      className={cn("active:bg-fill", isDisabled && "opacity-50")}
    >
      {row}
    </Pressable>
  );
}
