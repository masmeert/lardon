import { Stack } from "expo-router";
import { useState } from "react";
import { Provider } from "tinybase/ui-react";

import { useSheetOptions } from "#/_app/nav/use-sheet-options";
import { FamilyStores } from "#/entities/family";
import { SessionCookieContext, authClient } from "#/shared/auth";
import { PreferencesStore } from "#/shared/preferences";

export default function AppLayout() {
  const [sessionCookie] = useState(() => authClient.getCookie());
  const sheetOptions = useSheetOptions();

  return (
    <SessionCookieContext value={sessionCookie}>
      <Provider>
        <FamilyStores />
        <PreferencesStore />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="folder/new" options={sheetOptions} />
          <Stack.Screen name="tag/new" options={sheetOptions} />
        </Stack>
      </Provider>
    </SessionCookieContext>
  );
}
