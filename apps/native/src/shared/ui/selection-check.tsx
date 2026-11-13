import { View } from "react-native";

import { iconSize, useThemeColors } from "#/shared/lib";

import { Icon } from "./icon";

export function SelectionCheck({ isSelected }: { isSelected: boolean }) {
  const { white } = useThemeColors("white");

  return (
    <View className="size-6 items-center justify-center rounded-full bg-paper shadow-rim">
      {isSelected ? (
        <View className="size-5 items-center justify-center rounded-full bg-accent">
          <Icon name="checkmark" size={iconSize.xs} color={white} />
        </View>
      ) : (
        <View className="size-5 rounded-full border border-hairline" />
      )}
    </View>
  );
}
