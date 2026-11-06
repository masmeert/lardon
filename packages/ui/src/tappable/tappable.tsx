import { useRef, type ReactNode } from "react";
import { Pressable, type LayoutChangeEvent, type PressableProps } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

import { cn } from "../class-names";
import { springs } from "../motion/springs";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const pressTravelPt = 6;

export function pressedScale(longestSidePt: number) {
  return Math.min(0.985, Math.max(0.94, 1 - pressTravelPt / Math.max(longestSidePt, 1)));
}

export type TappableProps = Omit<PressableProps, "children" | "style"> & {
  children?: ReactNode;
  className?: string;
  overlay?: boolean;
  overlayClassName?: string;
};

export function Tappable({
  children,
  className,
  overlay = false,
  overlayClassName,
  onPress,
  onPressIn,
  onPressOut,
  onLayout,
  ...props
}: TappableProps) {
  const pressProgress = useSharedValue(0);
  const targetScale = useSharedValue(0.97);
  const pressStarted = useRef(false);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressProgress.get(), [0, 1], [1, targetScale.get()]) }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({ opacity: pressProgress.get() }));

  return (
    <AnimatedPressable
      role="button"
      {...props}
      className={className}
      style={scaleStyle}
      onLayout={(event: LayoutChangeEvent) => {
        targetScale.set(
          pressedScale(Math.max(event.nativeEvent.layout.width, event.nativeEvent.layout.height)),
        );
        onLayout?.(event);
      }}
      onPressIn={(event) => {
        pressStarted.current = true;
        pressProgress.set(withSpring(1, springs.fast));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressProgress.set(
          pressProgress.get() > 0.95
            ? withSpring(0, springs.moderate)
            : withSequence(withSpring(1, springs.fast), withSpring(0, springs.moderate)),
        );
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (!pressStarted.current) {
          pressProgress.set(
            withSequence(withSpring(1, springs.fast), withSpring(0, springs.moderate)),
          );
        }

        pressStarted.current = false;
        onPress?.(event);
      }}
    >
      {children}
      {overlay ? (
        <Animated.View
          pointerEvents="none"
          style={overlayStyle}
          className={cn("absolute inset-0 bg-pressed", overlayClassName)}
        />
      ) : null}
    </AnimatedPressable>
  );
}
