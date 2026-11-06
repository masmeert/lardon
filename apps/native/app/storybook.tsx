import { Redirect } from "expo-router";

import StorybookUI from "../.rnstorybook";

export default function StorybookScreen() {
  if (process.env.EXPO_PUBLIC_STORYBOOK_ENABLED !== "true") {
    return <Redirect href="/" />;
  }

  return <StorybookUI />;
}
