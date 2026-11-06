import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { DensityProvider } from "../sizes/density-context";
import { StoryPage } from "../storybook/story-page";
import { StorySection } from "../storybook/story-section";
import { Text } from "./text";
import type { TextTone, TypeRole } from "./type-roles";

const meta = {
  title: "Systems/Typography",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const roles = [
  { variant: "display", purpose: "Page title, one per screen", sample: "Family recipes" },
  { variant: "title", purpose: "Section title", sample: "Cooked this week" },
  {
    variant: "headline",
    purpose: "Card title, row title, button label",
    sample: "Grandma's cassoulet",
  },
  {
    variant: "body",
    purpose: "Reading text, steps, notes",
    sample: "Brown the lardons slowly until the fat runs clear.",
  },
  {
    variant: "caption",
    purpose: "Metadata next to content",
    sample: "45 min · Serves 4 · Added by Léa",
  },
  { variant: "micro", purpose: "Counters and tiny badges, one line only", sample: "12" },
] satisfies Array<{ variant: TypeRole; purpose: string; sample: string }>;

const tones = [
  { tone: "default", purpose: "Everything readable" },
  { tone: "muted", purpose: "Secondary text and metadata" },
  { tone: "accent", purpose: "Tappable text actions only" },
  { tone: "danger", purpose: "Errors only" },
  { tone: "success", purpose: "Confirmations only" },
] satisfies Array<{ tone: TextTone; purpose: string }>;

export const Roles: Story = {
  render() {
    return (
      <StoryPage
        title="Typography"
        summary="Six roles mapped to iOS text styles. Pick by purpose, never by size. Every role scales with Dynamic Type."
      >
        {(["default", "compact"] as const).map((density) => (
          <StorySection
            key={density}
            title={density === "default" ? "Default" : "Compact"}
            rule={
              density === "default"
                ? "Most screens."
                : "Dense regions drop every role one notch, size and leading together."
            }
          >
            <DensityProvider density={density}>
              {roles.map((role) => (
                <View key={role.variant} className="gap-0.5">
                  <Text variant="micro" tone="muted">
                    {role.variant} · {role.purpose}
                  </Text>
                  <Text variant={role.variant}>{role.sample}</Text>
                </View>
              ))}
            </DensityProvider>
          </StorySection>
        ))}
      </StoryPage>
    );
  },
};

export const Tones: Story = {
  render() {
    return (
      <StoryPage
        title="Text tones"
        summary="Two colors for reading text. Accent and danger are signals, not decoration."
      >
        <StorySection
          title="Tones"
          rule="No opacity steps, no uppercase labels, no letter-spacing. Hierarchy comes from role and weight."
        >
          {tones.map((entry) => (
            <View key={entry.tone} className="gap-0.5">
              <Text variant="headline" tone={entry.tone}>
                {entry.tone}
              </Text>
              <Text variant="caption" tone="muted">
                {entry.purpose}
              </Text>
            </View>
          ))}
        </StorySection>
      </StoryPage>
    );
  },
};
