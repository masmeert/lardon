import { cn, Typography } from "heroui-native";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type Props = {
  emoji: string;
  name: string;
  cookingTime: string;
  tint: string;
  className: string;
  emojiClassName: string;
  rotationDeg: number;
  floatDistancePt: number;
  floatPeriodMs: number;
};

export function RecipeCard({
  emoji,
  name,
  cookingTime,
  tint,
  className,
  emojiClassName,
  rotationDeg,
  floatDistancePt,
  floatPeriodMs,
}: Props) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    progress.value = withTiming(
      1,
      { duration: floatPeriodMs / 4, easing: Easing.out(Easing.sin) },
      () => {
        progress.value = withRepeat(
          withTiming(0, { duration: floatPeriodMs / 2, easing: Easing.inOut(Easing.sin) }),
          -1,
          true,
        );
      },
    );
  }, [progress, reduceMotion, floatPeriodMs]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-floatDistancePt, floatDistancePt]) },
      { rotate: `${rotationDeg + interpolate(progress.value, [0, 1], [-0.75, 0.75])}deg` },
    ],
  }));

  return (
    <Animated.View
      style={floatStyle}
      className={cn("rounded-3xl bg-surface p-2 shadow-surface", className)}
    >
      <View className={cn("aspect-square items-center justify-center rounded-2xl", tint)}>
        <Typography className={emojiClassName}>{emoji}</Typography>
      </View>
      <Typography numberOfLines={1} className="mt-2 px-1 text-sm font-medium text-foreground">
        {name}
      </Typography>
      <Typography className="px-1 pb-1 text-xs text-muted">{cookingTime}</Typography>
    </Animated.View>
  );
}
