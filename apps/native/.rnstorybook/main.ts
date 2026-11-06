import type { StorybookConfig } from "@storybook/react-native";

const main: StorybookConfig = {
  stories: ["../../../packages/ui/src/**/*.stories.?(ts|tsx)"],
  deviceAddons: ["@storybook/addon-ondevice-controls", "@storybook/addon-ondevice-actions"],
  framework: "@storybook/react-native",
};

export default main;
