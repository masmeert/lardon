import { Stack } from "expo-router";
import { useState } from "react";
import { Provider } from "tinybase/ui-react";

import { sheetOptions } from "#/_app/nav/sheet-options";
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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="folder/new" options={sheetOptions} />
          <Stack.Screen name="tag/new" options={sheetOptions} />
          <Stack.Screen name="family/new" options={sheetOptions} />
          <Stack.Screen name="family/join" options={sheetOptions} />
          <Stack.Screen name="family/rename" options={sheetOptions} />
          <Stack.Screen name="account/name" options={sheetOptions} />
          <Stack.Screen name="recipe/new" options={{ presentation: "modal" }} />
          <Stack.Screen name="recipe/[recipeId]/edit" options={{ presentation: "modal" }} />
          <Stack.Screen name="plan/[date]" options={{ presentation: "modal", headerShown: true }} />
        </Stack>
      </Provider>
    </SessionCookieContext>
  );
}
