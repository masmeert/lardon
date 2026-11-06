import { cn } from "heroui-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
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
  recipe: { emoji: string; title: string; ingredients: readonly string[] };
  ruledLineCount: number;
  isFeatured: boolean;
  className: string;
  rotationDeg: number;
  floatDistancePt: number;
  floatPeriodMs: number;
};

export function RecipeCard({
  recipe,
  ruledLineCount,
  isFeatured,
  className,
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
      className={cn(
        "overflow-hidden rounded-md border-[0.5px] border-border bg-[#FFFDF6] pb-3 pl-8 pr-3 pt-3 shadow-surface",
        className,
      )}
    >
      <View className="absolute bottom-0 left-6 top-0 w-px bg-danger/40" />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        className={cn(
          "pr-1.5 font-handwritten text-foreground",
          isFeatured ? "text-[34px] leading-9" : "text-[25px] leading-7.5",
        )}
      >
        {recipe.title}
      </Text>
      <View className="mt-1">
        {Array.from({ length: ruledLineCount }, (_, index) => (
          <View
            key={index}
            className={cn(
              "-ml-8 -mr-3 justify-end border-b border-accent-soft pl-8 pr-3",
              isFeatured ? "h-6.5" : "h-5.5",
            )}
          >
            <Text
              numberOfLines={1}
              className={cn(
                "font-handwritten text-foreground/70",
                isFeatured ? "text-[25px] leading-6.5" : "text-[20px] leading-5.5",
              )}
            >
              {recipe.ingredients[index] ?? ""}
            </Text>
          </View>
        ))}
      </View>
      <Text className={cn("absolute bottom-2 right-2.5", isFeatured ? "text-4xl" : "text-2xl")}>
        {recipe.emoji}
      </Text>
    </Animated.View>
  );
}
