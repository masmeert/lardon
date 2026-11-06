import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { StoryPage } from "../storybook/story-page";
import { StorySection } from "../storybook/story-section";
import { Surface } from "../surfaces/surface";
import { Text } from "../typography/text";
import { pressedScale, pressTravelPt, Tappable } from "./tappable";

const meta = {
  title: "Systems/Press feedback",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Travel: Story = {
  render() {
    return (
      <StoryPage
        title="Press feedback"
        summary={`A press shrinks the longest side by ${pressTravelPt}pt, whatever the size. Presses land fast, releases settle slower.`}
      >
        <StorySection
          title="Same travel at every size"
          rule="A percentage would make big cards lurch and small chips barely move. Scale stays between 0.94 and 0.985."
        >
          <View className="flex-row gap-3">
            {[96, 160].map((sizePt) => (
              <Tappable key={sizePt} className="rounded-card">
                <Surface
                  className="items-center justify-center rounded-card"
                  style={{ width: sizePt, height: sizePt }}
                >
                  <Text variant="caption" tone="muted">
                    {pressedScale(sizePt).toFixed(3)}
                  </Text>
                </Surface>
              </Tappable>
            ))}
          </View>
          <Tappable className="rounded-card">
            <Surface className="h-20 items-center justify-center rounded-card">
              <Text variant="caption" tone="muted">
                Full width · {pressedScale(350).toFixed(3)}
              </Text>
            </Surface>
          </Tappable>
        </StorySection>
        <StorySection
          title="Only tappable things move"
          rule="An informational card never reacts to a press: the motion would promise an action with nowhere to land."
        >
          <Surface className="h-20 items-center justify-center rounded-card">
            <Text variant="caption" tone="muted">
              Not tappable
            </Text>
          </Surface>
        </StorySection>
      </StoryPage>
    );
  },
};
