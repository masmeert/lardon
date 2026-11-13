import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { cn, motionMs } from "#/shared/lib";

import { RollingDigit } from "./rolling-digit";

export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const digits = String(value).split("");

  return (
    <View accessible accessibilityLabel={String(value)} className="flex-row">
      {digits.map((digit, index) => (
        <Animated.View
          key={digits.length - index}
          entering={FadeIn.duration(motionMs.fast)}
          exiting={FadeOut.duration(motionMs.exit)}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <RollingDigit digit={Number(digit)} className={cn("tabular-nums", className)} />
        </Animated.View>
      ))}
    </View>
  );
}
