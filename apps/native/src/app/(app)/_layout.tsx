import { Stack } from "expo-router";
import { Provider } from "tinybase/ui-react";

import { FamilyStores } from "#/entities/family";
import { useThemeColors } from "#/shared/lib";

export default function AppLayout() {
  const { background } = useThemeColors("background");

  return (
    <Provider>
      <FamilyStores />
      <Stack screenOptions={{ contentStyle: { backgroundColor: background } }} />
    </Provider>
  );
}
