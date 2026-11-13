import { Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { iconSize, motionMs, useThemeColors } from "#/shared/lib";

import { Icon } from "./icon";

export function InlineError({ children }: { children: string }) {
  const { danger } = useThemeColors("danger");

  return (
    <Animated.View
      entering={FadeIn.duration(motionMs.fast)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="flex-row items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1.5"
    >
      <Icon name="exclamationmark.triangle.fill" size={iconSize.sm} color={danger} />
      <Text className="shrink text-label font-medium text-danger">{children}</Text>
    </Animated.View>
  );
}
