import { cn } from "heroui-native";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export function RollingDigit({ digit, className }: { digit: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const position = useSharedValue(digit);
  const digitHeightPt = useSharedValue(0);
  const previousDigit = useRef(digit);

  useEffect(() => {
    if (digit === previousDigit.current) {
      return;
    }

    const target = previousDigit.current + ((digit - previousDigit.current + 15) % 10) - 5;

    previousDigit.current = digit;

    if (reduceMotion) {
      position.value = digit;

      return;
    }

    position.value = withTiming(
      target,
      { duration: 450, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          position.value = digit;
        }
      },
    );
  }, [digit, position, reduceMotion]);

  const columnStyle = useAnimatedStyle(() => ({
    opacity: digitHeightPt.value > 0 ? 1 : 0,
    transform: [{ translateY: -(position.value + 10) * digitHeightPt.value }],
  }));

  return (
    <View className="overflow-hidden">
      <Text
        className={cn("opacity-0", className)}
        onLayout={(event) => {
          digitHeightPt.value = event.nativeEvent.layout.height;
        }}
      >
        0
      </Text>
      <Animated.View style={columnStyle} className="absolute inset-x-0 top-0 items-center">
        {Array.from({ length: 30 }, (_, index) => (
          <Text key={index} className={className}>
            {index % 10}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}
