import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function SignInLayout() {
  const foregroundColor = useThemeColor("foreground");
  const backgroundColor = useThemeColor("background");

  return (
    <Stack
      screenOptions={{
        title: "",
        headerTintColor: foregroundColor,
        headerStyle: { backgroundColor },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
