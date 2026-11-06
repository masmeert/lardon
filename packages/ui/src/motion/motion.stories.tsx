import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Button } from "../button/button";
import { StoryPage } from "../storybook/story-page";
import { StorySection } from "../storybook/story-section";
import { Text } from "../typography/text";
import { exits, springs, type MotionTier } from "./springs";

const meta = {
  title: "Systems/Motion",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const tiers = [
  { tier: "fast", use: "Press feedback, fades, icon swaps" },
  { tier: "moderate", use: "Chips, segmented controls, expanding rows. Lands with no overshoot" },
  { tier: "slow", use: "Large surfaces, card to detail. A small settle" },
] satisfies Array<{ tier: MotionTier; use: string }>;

function TierDemo({ tier, use }: { tier: MotionTier; use: string }) {
  const progress = useSharedValue(0);

  const travelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.get() * 220 }],
    opacity: 0.4 + progress.get() * 0.6,
  }));

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 gap-0.5">
          <Text variant="headline">
            {tier} · {springs[tier].duration}ms in, {exits[tier].duration}ms out
          </Text>
          <Text variant="caption" tone="muted">
            {use}
          </Text>
        </View>
        <Button
          label="Play"
          size="compact"
          variant="secondary"
          onPress={() => {
            progress.set(
              withSpring(1, springs[tier], () => {
                progress.set(withTiming(0, exits[tier]));
              }),
            );
          }}
        />
      </View>
      <View className="h-12 justify-center rounded-tile bg-well px-1">
        <Animated.View style={travelStyle} className="size-10 rounded-xl bg-accent" />
      </View>
    </View>
  );
}

export const Tiers: Story = {
  render() {
    return (
      <StoryPage
        title="Motion"
        summary="Three spring tiers. The bigger the thing that moves, the slower the tier. Never write a duration by hand."
      >
        <StorySection
          title="Tiers"
          rule="Exits are plain timing curves one tier quicker, with no bounce: a dismissal is a decision already made."
        >
          {tiers.map((entry) => (
            <TierDemo key={entry.tier} tier={entry.tier} use={entry.use} />
          ))}
        </StorySection>
        <StorySection
          title="Reduce Motion"
          rule="Fewer and gentler, not none. Movement and scale drop; opacity fades stay because they explain what changed."
        >
          <Text variant="caption" tone="muted">
            Every tier sets reduceMotion to follow the system setting. Turn on Reduce Motion in
            Settings and replay.
          </Text>
        </StorySection>
      </StoryPage>
    );
  },
};
