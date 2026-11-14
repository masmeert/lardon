import { Stack, router } from "expo-router";
import { ActivityIndicator } from "react-native";

import { useThemeColors } from "#/shared/lib";

export function RecipeEditorToolbar({
  saveLabel,
  canSave,
  isSaving,
  onSave,
}: {
  saveLabel: string;
  canSave: boolean;
  isSaving: boolean;
  onSave: () => void;
}) {
  const { accent } = useThemeColors("accent");

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="xmark"
          accessibilityLabel="Close"
          disabled={isSaving}
          onPress={router.back}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        {isSaving ? (
          <Stack.Toolbar.View>
            <ActivityIndicator />
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Button
            icon="checkmark"
            variant="prominent"
            tintColor={accent}
            accessibilityLabel={saveLabel}
            disabled={!canSave}
            onPress={onSave}
          />
        )}
      </Stack.Toolbar>
    </>
  );
}
