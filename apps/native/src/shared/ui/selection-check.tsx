import { View } from "react-native";

import { cn, iconSize, useThemeColors } from "#/shared/lib";

import { Icon } from "./icon";

export function SelectionCheck({
  isSelected,
  isOnPhoto = false,
}: {
  isSelected: boolean;
  isOnPhoto?: boolean;
}) {
  const { white } = useThemeColors("white");

  return (
    <View
      className={cn(
        "size-6 items-center justify-center rounded-full border-[1.5px]",
        isSelected && "border-white bg-accent",
        !isSelected && (isOnPhoto ? "border-white shadow-rim" : "border-muted/50"),
      )}
    >
      {isSelected && <Icon name="checkmark" size={iconSize.xs} color={white} />}
    </View>
  );
}
