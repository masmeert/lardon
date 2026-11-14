import { Stack } from "expo-router";
import { ActivityIndicator } from "react-native";

import type { useSaveRecipe } from "../model/use-save-recipe";

export function saveToolbarItem({
  save,
  savedCopy,
  unsave,
  destinations,
}: ReturnType<typeof useSaveRecipe>) {
  if (save.isPending) {
    return (
      <Stack.Toolbar.View>
        <ActivityIndicator />
      </Stack.Toolbar.View>
    );
  }

  if (savedCopy) {
    return (
      <Stack.Toolbar.Button
        icon="bookmark.fill"
        accessibilityLabel="Saved. Remove from my recipes"
        onPress={unsave}
      />
    );
  }

  return (
    <Stack.Toolbar.Menu icon="bookmark" accessibilityLabel="Save to my recipes">
      <Stack.Toolbar.Menu inline title="Save to">
        {destinations.map((destination) => (
          <Stack.Toolbar.MenuAction
            key={destination.familyId}
            icon={destination.icon}
            onPress={() => save.mutate(destination.familyId)}
          >
            {destination.label}
          </Stack.Toolbar.MenuAction>
        ))}
      </Stack.Toolbar.Menu>
    </Stack.Toolbar.Menu>
  );
}
