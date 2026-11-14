import { Stack } from "expo-router";

import { useThemeColors } from "#/shared/lib";

import { RecipeEditorProvider } from "../model/recipe-editor";
import type { EditorBase } from "../model/recipe-fields";

export function RecipeEditorStack({ title, base }: { title: string; base: EditorBase }) {
  const { background, foreground } = useThemeColors("background", "foreground");

  return (
    <RecipeEditorProvider base={base}>
      <Stack
        screenOptions={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTintColor: foreground,
          headerBackButtonDisplayMode: "minimal",
          scrollEdgeEffects: { top: "soft" },
          contentStyle: { backgroundColor: background },
        }}
      >
        <Stack.Screen name="index" options={{ title }} />
        <Stack.Screen name="folders" options={{ title: "Folders" }} />
        <Stack.Screen name="tags" options={{ title: "Tags" }} />
      </Stack>
    </RecipeEditorProvider>
  );
}
