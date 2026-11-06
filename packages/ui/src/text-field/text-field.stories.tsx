import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { TextField } from "./text-field";

const meta = {
  title: "Components/TextField",
  component: TextField,
  decorators: [
    (Story) => (
      <View className="flex-1 justify-center bg-background p-5">
        <Story />
      </View>
    ),
  ],
  args: {
    label: "Email",
    placeholder: "email@example.com",
    error: null,
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithError: Story = {
  args: {
    defaultValue: "lea@",
    error: "This email is missing its domain. Check what comes after the @.",
  },
};
