import { Stack } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button } from "./button/button";
import { ButtonLabel } from "./button/button-label";
import { InlineError } from "./inline-error";
import { SheetContent } from "./sheet-content";
import { TextBox } from "./text-box";

export function NameSheet({
  title,
  initialName = "",
  placeholder,
  actionLabel,
  isPending,
  error,
  onSubmit,
}: {
  title: string;
  initialName?: string;
  placeholder: string;
  actionLabel: string;
  isPending: boolean;
  error: string | undefined;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && trimmedName !== initialName && !isPending;

  function submit() {
    if (canSubmit) onSubmit(trimmedName);
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      <SheetContent className="gap-5 px-6 pt-2 pb-8">
        <View className="gap-1.5">
          <TextBox
            value={name}
            onChangeText={setName}
            placeholder={placeholder}
            maxLength={80}
            autoFocus
            autoCapitalize="words"
            clearButtonMode="while-editing"
            returnKeyType="done"
            enablesReturnKeyAutomatically
            editable={!isPending}
            onSubmitEditing={submit}
          />
          <View className="min-h-4.5">
            {error && <InlineError variant="text">{error}</InlineError>}
          </View>
        </View>
        <Button isDisabled={!canSubmit && !isPending} isLoading={isPending} onPress={submit}>
          <ButtonLabel>{actionLabel}</ButtonLabel>
        </Button>
      </SheetContent>
    </>
  );
}
