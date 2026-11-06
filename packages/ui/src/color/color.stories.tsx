import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { StoryPage } from "../storybook/story-page";
import { StorySection } from "../storybook/story-section";
import { ThemeColumns } from "../storybook/theme-columns";
import { Text } from "../typography/text";

const meta = {
  title: "Systems/Color",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const neutralSwatches = [
  { name: "background", className: "bg-background" },
  { name: "raised", className: "bg-raised" },
  { name: "floating", className: "bg-floating" },
  { name: "well", className: "bg-well" },
  { name: "tint", className: "bg-tint" },
  { name: "foreground", className: "bg-foreground" },
  { name: "muted", className: "bg-muted" },
  { name: "hairline", className: "bg-hairline" },
];

const signalSwatches = [
  { name: "accent", className: "bg-accent" },
  { name: "danger", className: "bg-danger" },
  { name: "success", className: "bg-success" },
];

export const Tokens: Story = {
  render() {
    return (
      <StoryPage
        title="Color"
        summary="Warm neutrals carry the interface. One accent marks the main action. Signal colors are rare and always paired with an icon or words."
      >
        <StorySection
          title="Neutrals"
          rule="Text uses foreground or muted only. Never fade text with opacity."
        >
          <ThemeColumns>
            {() =>
              neutralSwatches.map((swatch) => (
                <View key={swatch.name} className="flex-row items-center gap-2">
                  <View
                    className={`size-8 rounded-lg border border-hairline ${swatch.className}`}
                  />
                  <Text variant="caption">{swatch.name}</Text>
                </View>
              ))
            }
          </ThemeColumns>
        </StorySection>
        <StorySection
          title="Signals"
          rule="Accent for the main action, danger for errors and destructive actions, success for confirmations."
        >
          <ThemeColumns>
            {() =>
              signalSwatches.map((swatch) => (
                <View key={swatch.name} className="flex-row items-center gap-2">
                  <View className={`size-8 rounded-lg ${swatch.className}`} />
                  <Text variant="caption">{swatch.name}</Text>
                </View>
              ))
            }
          </ThemeColumns>
        </StorySection>
      </StoryPage>
    );
  },
};
