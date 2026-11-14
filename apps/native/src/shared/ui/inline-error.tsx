import { Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { cn, iconSize, motionMs, useThemeColors } from "#/shared/lib";

import { Icon } from "./icon";

export function InlineError({
  variant = "pill",
  children,
}: {
  variant?: "pill" | "text";
  children: string;
}) {
  const { danger } = useThemeColors("danger");

  return (
    <Animated.View
      entering={FadeIn.duration(motionMs.fast)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={cn(
        "flex-row items-center gap-1.5",
        variant === "pill" && "rounded-full bg-danger-soft px-3 py-1.5",
      )}
    >
      <Icon name="exclamationmark.triangle.fill" size={iconSize.sm} color={danger} />
      <Text
        className={cn(
          "shrink text-danger",
          variant === "pill" ? "text-label font-medium" : "text-caption",
        )}
      >
        {children}
      </Text>
    </Animated.View>
  );
}
