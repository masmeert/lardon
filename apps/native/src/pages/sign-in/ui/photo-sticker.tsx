import { useEffect } from "react";
import { Image, type ImageSourcePropType, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { PhotoFrame } from "#/shared/ui";

type Props = {
  source: ImageSourcePropType;
  sizePt: number;
  className?: string;
  rotationDeg: number;
  floatDistancePt: number;
  floatPeriodMs: number;
};

export function PhotoSticker({
  source,
  sizePt,
  className,
  rotationDeg,
  floatDistancePt,
  floatPeriodMs,
}: Props) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0.5);
  const borderRadius = Math.round(sizePt * 0.23);

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
    <Animated.View style={floatStyle} className={className}>
      <PhotoFrame style={{ width: sizePt, height: sizePt, borderRadius }}>
        <View
          style={{ borderRadius: borderRadius - 2, borderCurve: "continuous" }}
          className="flex-1 overflow-hidden bg-placeholder"
        >
          <Image source={source} resizeMode="cover" className="size-full" />
        </View>
      </PhotoFrame>
    </Animated.View>
  );
}
