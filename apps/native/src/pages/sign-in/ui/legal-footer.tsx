import * as WebBrowser from "expo-web-browser";
import { Text, View } from "react-native";

import { ENV } from "#/shared/config";

export function LegalFooter() {
  return (
    <View className="gap-5 pt-2">
      <View className="h-px overflow-hidden">
        <View className="h-0.5 border border-dashed border-hairline" />
      </View>
      <Text className="px-8 text-center font-normal text-label text-muted">
        By continuing, you agree to Lardon's{" "}
        <Text
          accessibilityRole="link"
          onPress={() => void WebBrowser.openBrowserAsync(`${ENV.EXPO_PUBLIC_WEBSITE_URL}/terms`)}
          className="text-label text-muted underline"
        >
          Terms of Use
        </Text>{" "}
        and{" "}
        <Text
          accessibilityRole="link"
          onPress={() => void WebBrowser.openBrowserAsync(`${ENV.EXPO_PUBLIC_WEBSITE_URL}/privacy`)}
          className="text-label text-muted underline"
        >
          Privacy Policy
        </Text>
      </Text>
    </View>
  );
}
