import { View } from "react-native";
import Sortable from "react-native-sortables";

import { iconSize, useThemeColors } from "#/shared/lib";
import { Icon } from "#/shared/ui";

export function DragHandle({ label }: { label: string }) {
  const { muted } = useThemeColors("muted");

  return (
    <Sortable.Handle>
      <View
        accessible
        accessibilityLabel={label}
        accessibilityHint="Touch and hold, then drag to reorder"
        className="h-13 w-8 items-center justify-center"
      >
        <Icon name="line.3.horizontal" size={iconSize.lg} color={muted} />
      </View>
    </Sortable.Handle>
  );
}
