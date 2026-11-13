import { Stack } from "expo-router";

import { useHeaderOptions } from "#/_app/nav/use-header-options";
import { useThemeColors } from "#/shared/lib";

export default function SignInLayout() {
  const headerOptions = useHeaderOptions();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: useThemeColors("background").background },
      }}
    >
      <Stack.Screen name="email" options={headerOptions({})} />
      <Stack.Screen name="code" options={headerOptions({})} />
    </Stack>
  );
}
