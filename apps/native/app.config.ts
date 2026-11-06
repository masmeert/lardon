import type { ConfigContext, ExpoConfig } from "expo/config";

export default function appConfig({ config }: ConfigContext): Partial<ExpoConfig> {
  if (process.env.EXPO_PUBLIC_STORYBOOK_ENABLED !== "true") {
    return config;
  }

  return { ...config, web: { ...config.web, output: "single" } };
}
