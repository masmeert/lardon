import { Stack } from "expo-router";

import { useHeaderOptions } from "#/_app/nav/use-header-options";
import { useThemeColor } from "#/shared/lib";

export default function SignInLayout() {
  const headerOptions = useHeaderOptions();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: useThemeColor("background") },
      }}
    >
      <Stack.Screen name="email" options={headerOptions({})} />
      <Stack.Screen name="code" options={headerOptions({})} />
    </Stack>
  );
}
