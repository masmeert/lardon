import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

export function InlineError({ children }: { children: string }) {
  const dangerColor = useThemeColor("danger");

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="flex-row items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1.5"
    >
      <Ionicons name="warning" size={14} color={dangerColor} />
      <Text className="shrink text-[13px] font-medium text-danger">{children}</Text>
    </Animated.View>
  );
}
