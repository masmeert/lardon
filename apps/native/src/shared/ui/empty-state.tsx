import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { iconSize, useThemeColors } from "#/shared/lib";

import { Icon, type IconName } from "./icon";

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: IconName;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  const { muted } = useThemeColors("muted");

  return (
    <View className="items-center gap-1.5 px-8 py-12">
      <View className="mb-2 size-12 items-center justify-center rounded-full bg-fill">
        <Icon name={icon} size={iconSize.xl} color={muted} />
      </View>
      <Text className="text-center font-heading text-heading text-foreground">{title}</Text>
      <Text className="max-w-xs text-center text-body text-muted">{description}</Text>
      {children && <View className="mt-4 flex-row justify-center">{children}</View>}
    </View>
  );
}
