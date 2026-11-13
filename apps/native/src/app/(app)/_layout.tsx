import { Stack } from "expo-router";
import { Provider } from "tinybase/ui-react";

import { FamilyStores } from "#/entities/family";
import { PreferencesStore } from "#/shared/preferences";

export default function AppLayout() {
  return (
    <Provider>
      <FamilyStores />
      <PreferencesStore />
      <Stack screenOptions={{ headerShown: false }} />
    </Provider>
  );
}
