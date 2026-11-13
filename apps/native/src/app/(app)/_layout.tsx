import { Stack } from "expo-router";
import { useState } from "react";
import { Provider } from "tinybase/ui-react";

import { FamilyStores } from "#/entities/family";
import { SessionCookieContext, authClient } from "#/shared/auth";
import { PreferencesStore } from "#/shared/preferences";

export default function AppLayout() {
  const [sessionCookie] = useState(() => authClient.getCookie());

  return (
    <SessionCookieContext value={sessionCookie}>
      <Provider>
        <FamilyStores />
        <PreferencesStore />
        <Stack screenOptions={{ headerShown: false }} />
      </Provider>
    </SessionCookieContext>
  );
}
