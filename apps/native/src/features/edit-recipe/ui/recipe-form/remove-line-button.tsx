import { Pressable } from "react-native";

import { iconSize, useThemeColors } from "#/shared/lib";
import { Icon } from "#/shared/ui";

export function RemoveLineButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { danger } = useThemeColors("danger");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      className="h-11 justify-center active:opacity-60"
    >
      <Icon name="minus.circle.fill" size={iconSize.lg} color={danger} />
    </Pressable>
  );
}
