import * as WebBrowser from "expo-web-browser";
import { Typography } from "heroui-native";
import { View } from "react-native";

import { ENV } from "@/src/env";

export function LegalFooter() {
  return (
    <View className="gap-5 pt-2">
      <View className="h-px overflow-hidden">
        <View className="h-0.5 border border-dashed border-border" />
      </View>
      <Typography className="px-8 text-center text-[13px] leading-4.5 text-muted">
        By continuing, you agree to Lardon's{" "}
        <Typography
          accessibilityRole="link"
          onPress={() => void WebBrowser.openBrowserAsync(`${ENV.EXPO_PUBLIC_WEBSITE_URL}/terms`)}
          className="text-[13px] leading-4.5 text-muted underline"
        >
          Terms of Use
        </Typography>{" "}
        and{" "}
        <Typography
          accessibilityRole="link"
          onPress={() => void WebBrowser.openBrowserAsync(`${ENV.EXPO_PUBLIC_WEBSITE_URL}/privacy`)}
          className="text-[13px] leading-4.5 text-muted underline"
        >
          Privacy Policy
        </Typography>
      </Typography>
    </View>
  );
}
