import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { ThemeColumns } from "../storybook/theme-columns";
import { Surface } from "../surfaces/surface";
import { TextField } from "../text-field/text-field";
import { Text } from "../typography/text";
import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  decorators: [
    (Story) => (
      <View className="flex-1 items-center justify-center bg-background p-5">
        <Story />
      </View>
    ),
  ],
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "plain", "destructive"] },
    size: { control: "select", options: ["large", "default", "compact"] },
  },
  args: {
    label: "Add recipe",
    variant: "primary",
    size: "default",
    iconOnly: false,
    loading: false,
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithIcon: Story = {
  args: { icon: "plus" },
};

export const Loading: Story = {
  args: { loading: true },
};

export const Destructive: Story = {
  args: { label: "Delete recipe", variant: "destructive", icon: "trash" },
};

export const Tactile: Story = {
  render() {
    return (
      <View className="self-stretch">
        <ThemeColumns>
          {() => (
            <View className="items-start gap-5 p-2">
              <Button label="Add recipe" icon="plus" />
              <Button label="Share" variant="secondary" icon="square.and.arrow.up" />
              <Button label="Delete" variant="destructive" icon="trash" />
              <Button label="Skip" variant="plain" />
              <View className="flex-row gap-4">
                <Button label="Next" icon="chevron.right" variant="secondary" iconOnly />
                <Button label="Add" icon="plus" iconOnly />
                <Button label="Close" icon="xmark" variant="secondary" size="compact" iconOnly />
              </View>
              <View className="flex-row gap-4">
                <Button label="Save" disabled />
                <Button label="Share" variant="secondary" disabled />
              </View>
            </View>
          )}
        </ThemeColumns>
      </View>
    );
  },
};

export const InAForm: Story = {
  render() {
    return (
      <View className="w-full max-w-sm rounded-sheet bg-well p-2">
        <Surface className="rounded-card">
          <View className="items-center gap-2 px-6 pt-8 pb-6">
            <Text variant="display" className="text-center">
              Welcome back
            </Text>
            <Text tone="muted" className="text-center">
              Sign in or create an account to share your family's recipes.
            </Text>
          </View>
          <View className="gap-4 border-t border-hairline p-6">
            <TextField
              label="Email"
              placeholder="lea@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button label="Continue with email" size="large" disabled />
            <View className="flex-row items-center gap-3">
              <View className="h-px flex-1 bg-hairline" />
              <Text variant="caption" tone="muted">
                or
              </Text>
              <View className="h-px flex-1 bg-hairline" />
            </View>
            <View className="flex-row gap-3">
              <Button
                label="Continue with Apple"
                icon="apple.logo"
                variant="secondary"
                size="large"
                iconOnly
                className="flex-1"
              />
              <Button
                label="Continue with Google"
                icon="g.circle.fill"
                variant="secondary"
                size="large"
                iconOnly
                className="flex-1"
              />
            </View>
          </View>
        </Surface>
        <Text variant="caption" tone="muted" className="px-6 py-4 text-center">
          By continuing, you agree to our Terms of Use and Privacy Policy.
        </Text>
      </View>
    );
  },
};
