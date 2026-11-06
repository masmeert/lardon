import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { Button } from "../button/button";
import { StoryPage } from "../storybook/story-page";
import { StorySection } from "../storybook/story-section";
import { Text } from "../typography/text";
import { DensityProvider } from "./density-context";
import { controlSizes, regionGaps } from "./size-steps";

const meta = {
  title: "Systems/Sizes",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ladder: Story = {
  render() {
    return (
      <StoryPage
        title="Sizes"
        summary="Three control heights. Text, icon, padding and gaps step with the height so a control shrinks as a whole."
      >
        <StorySection
          title="Control heights"
          rule="Large is for the one primary action of a flow. Compact reaches 44pt with hit slop."
        >
          {(["large", "default", "compact"] as const).map((size) => (
            <View key={size} className="flex-row items-center gap-3">
              <Button label="Add recipe" icon="plus" size={size} />
              <Text variant="caption" tone="muted">
                {size} · {controlSizes[size].heightPt}pt
              </Text>
            </View>
          ))}
        </StorySection>
        <StorySection
          title="Density is a region decision"
          rule="Wrap a region once. Everything inside follows, nothing is sized one by one."
        >
          {(["default", "compact"] as const).map((density) => (
            <DensityProvider key={density} density={density}>
              <View className={`flex-row flex-wrap ${regionGaps[density]}`}>
                <Button label="Save" />
                <Button label="Share" variant="secondary" icon="square.and.arrow.up" />
                <Button label="Delete" variant="destructive" />
              </View>
            </DensityProvider>
          ))}
        </StorySection>
      </StoryPage>
    );
  },
};
