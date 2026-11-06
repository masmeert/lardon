import { cn } from "heroui-native";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { RollingDigit } from "@/components/rolling-number/rolling-digit";

export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const digits = String(value).split("");

  return (
    <View accessible accessibilityLabel={String(value)} className="flex-row">
      {digits.map((digit, index) => (
        <Animated.View
          key={digits.length - index}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <RollingDigit digit={Number(digit)} className={cn("tabular-nums", className)} />
        </Animated.View>
      ))}
    </View>
  );
}
