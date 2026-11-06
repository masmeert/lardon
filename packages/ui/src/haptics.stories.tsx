import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { Button } from "./button/button";
import { haptics } from "./haptics";
import { StoryPage } from "./storybook/story-page";
import { StorySection } from "./storybook/story-section";
import { Text } from "./typography/text";

const meta = {
  title: "Systems/Haptics",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const feedbacks = [
  {
    name: "selectionChanged",
    when: "A picker, segmented control or toggle lands on a new value",
    play: haptics.selectionChanged,
  },
  {
    name: "snapped",
    when: "A drag snaps into place or a list item is reordered",
    play: haptics.snapped,
  },
  {
    name: "succeeded",
    when: "Something the person waited for finished: recipe saved, invite sent",
    play: haptics.succeeded,
  },
  { name: "warned", when: "A destructive confirmation appears", play: haptics.warned },
  { name: "failed", when: "An action failed and the screen shows why", play: haptics.failed },
];

export const Vocabulary: Story = {
  render() {
    return (
      <StoryPage
        title="Haptics"
        summary="Haptics mark state changes, not taps. A plain button press stays silent: the press animation is the feedback."
      >
        <StorySection
          title="Vocabulary"
          rule="Native controls (switches, menus, sheets, tab bar) already play their own. Never add a second one."
        >
          {feedbacks.map((feedback) => (
            <View key={feedback.name} className="flex-row items-center gap-3">
              <View className="flex-1 gap-0.5">
                <Text variant="headline">{feedback.name}</Text>
                <Text variant="caption" tone="muted">
                  {feedback.when}
                </Text>
              </View>
              <Button label="Feel" size="compact" variant="secondary" onPress={feedback.play} />
            </View>
          ))}
        </StorySection>
      </StoryPage>
    );
  },
};
