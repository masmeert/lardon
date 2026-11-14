import { Pressable } from "react-native";

import { iconSize, useThemeColors } from "#/shared/lib";

import { Icon } from "./icon";

export function ClearButton({ onPress }: { onPress: () => void }) {
  const { accent } = useThemeColors("accent");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Clear"
      hitSlop={12}
      onPress={onPress}
      className="size-5 items-center justify-center rounded-full bg-accent-soft"
    >
      <Icon name="xmark" size={iconSize.xs} color={accent} />
    </Pressable>
  );
}
