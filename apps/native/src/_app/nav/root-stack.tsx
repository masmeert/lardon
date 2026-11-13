import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useState } from "react";

import { LaunchReveal } from "#/_app/ui/launch-reveal";
import { authClient } from "#/shared/auth";

void SplashScreen.preventAutoHideAsync();

export function RootStack() {
  const { data: session, isPending } = authClient.useSession();

  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  if (!isPending && !hasCheckedSession) {
    setHasCheckedSession(true);
  }

  if (!hasCheckedSession) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
      <LaunchReveal />
    </>
  );
}
