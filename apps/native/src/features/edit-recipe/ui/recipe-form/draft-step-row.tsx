import type { DraftStep } from "@lardon/recipes";
import { Text, TextInput, View } from "react-native";

import { useThemeColors } from "#/shared/lib";

import { DragHandle } from "./drag-handle";
import type { LineControls } from "./draft-list";
import { RemoveLineButton } from "./remove-line-button";

export function DraftStepRow({
  step,
  number,
  inputRef,
  onChange,
  onSubmit,
  onRemove,
}: { step: DraftStep } & LineControls<DraftStep>) {
  const { accent, muted } = useThemeColors("accent", "muted");

  return (
    <View className="flex-row items-start gap-3 pr-2">
      <RemoveLineButton label={`Remove step ${number}`} onPress={onRemove} />
      <View className="h-11 justify-center">
        <View className="size-5.5 items-center justify-center rounded-full bg-background shadow-rim">
          <Text className="text-label font-bold text-accent">{number}</Text>
        </View>
      </View>
      <TextInput
        ref={inputRef}
        value={step.text}
        onChangeText={(text) => onChange({ ...step, text })}
        onSubmitEditing={onSubmit}
        submitBehavior="submit"
        returnKeyType="next"
        multiline
        maxLength={5000}
        placeholder="Describe this step"
        placeholderTextColor={muted}
        accessibilityLabel={`Step ${number}`}
        selectionColor={accent}
        autoCapitalize="sentences"
        className="min-h-11 flex-1 py-2.5 text-title text-foreground"
      />
      <DragHandle label={`Move step ${number}`} />
    </View>
  );
}
