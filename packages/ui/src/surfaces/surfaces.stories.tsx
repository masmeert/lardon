import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { StoryPage } from "../storybook/story-page";
import { StorySection } from "../storybook/story-section";
import { ThemeColumns } from "../storybook/theme-columns";
import { Text } from "../typography/text";
import { Surface } from "./surface";
import { nestedRadius } from "./surface-level";

const meta = {
  title: "Systems/Surfaces",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ladder: Story = {
  render() {
    return (
      <StoryPage
        title="Surfaces"
        summary="Three levels: background, raised, floating. A surface finds its level from the one it sits on, so nesting never melts into its parent."
      >
        <StorySection
          title="Ladder"
          rule="Light mode: shadow carries elevation. Dark mode: each level is lighter."
        >
          <ThemeColumns>
            {() => (
              <Surface className="gap-2 rounded-card p-3">
                <Text variant="caption">raised</Text>
                <Surface className="rounded-tile p-3">
                  <Text variant="caption">floating</Text>
                </Surface>
              </Surface>
            )}
          </ThemeColumns>
        </StorySection>
        <StorySection
          title="Concentric corners"
          rule={`Inner radius = outer − inset − border. A 24pt card with 8pt padding holds a ${nestedRadius(24, 8)}pt tile.`}
        >
          <View className="flex-row gap-3">
            <View className="flex-1 gap-2">
              <Surface className="rounded-card p-2">
                <View className="aspect-square rounded-tile bg-well" />
              </Surface>
              <Text variant="caption" tone="muted">
                Concentric
              </Text>
            </View>
            <View className="flex-1 gap-2">
              <Surface className="rounded-card p-2">
                <View className="aspect-square rounded-card bg-well" />
              </Surface>
              <Text variant="caption" tone="danger">
                Same radius: the gap pinches at the corners
              </Text>
            </View>
          </View>
        </StorySection>
        <StorySection
          title="Glass"
          rule="Liquid Glass belongs to floating controls over content: tab bar, headers, floating buttons. Never on content cards."
        >
          <Text variant="caption" tone="muted">
            Glass comes from the native tab bar and headers. Use expo-glass-effect only for our own
            floating controls.
          </Text>
        </StorySection>
      </StoryPage>
    );
  },
};
