import {
  Easing,
  ReduceMotion,
  type WithSpringConfig,
  type WithTimingConfig,
} from "react-native-reanimated";

export type MotionTier = "fast" | "moderate" | "slow";

export const springs = {
  fast: { duration: 150, dampingRatio: 1, reduceMotion: ReduceMotion.System },
  moderate: { duration: 280, dampingRatio: 1, reduceMotion: ReduceMotion.System },
  slow: { duration: 420, dampingRatio: 0.85, reduceMotion: ReduceMotion.System },
} satisfies Record<MotionTier, WithSpringConfig>;

export const exits = {
  fast: { duration: 100, easing: Easing.in(Easing.quad), reduceMotion: ReduceMotion.System },
  moderate: { duration: 180, easing: Easing.in(Easing.quad), reduceMotion: ReduceMotion.System },
  slow: { duration: 260, easing: Easing.in(Easing.quad), reduceMotion: ReduceMotion.System },
} satisfies Record<MotionTier, WithTimingConfig>;

export function keepWhenMotionReduced<Config extends WithSpringConfig | WithTimingConfig>(
  config: Config,
) {
  return { ...config, reduceMotion: ReduceMotion.Never };
}
