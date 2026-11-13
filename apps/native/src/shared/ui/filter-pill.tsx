import { Text } from "react-native";

import { cn, useThemeColors } from "#/shared/lib";

import { Glass } from "./glass";
import { PressableScale } from "./pressable-scale";

export function FilterPill({
  label,
  isSelected = false,
  onPress,
}: {
  label: string;
  isSelected?: boolean;
  onPress: () => void;
}) {
  const { accent } = useThemeColors("accent");

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      className="h-control-sm flex-row items-center rounded-full px-3.5"
    >
      <Glass
        isInteractive
        tintColor={isSelected ? accent : undefined}
        className="absolute inset-0 rounded-full"
      />
      <Text
        className={cn("text-label font-semibold", isSelected ? "text-white" : "text-foreground")}
      >
        {label}
      </Text>
    </PressableScale>
  );
}
