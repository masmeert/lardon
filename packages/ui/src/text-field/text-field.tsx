import { useState, type ComponentRef, type Ref } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { cn } from "../class-names";
import { DensityProvider } from "../sizes/density-context";
import { Text } from "../typography/text";
import { useToneColor } from "../typography/tone-color";

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  className?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function TextField({ label, error, className, onFocus, onBlur, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const placeholderColor = useToneColor("muted");
  const caretColor = useToneColor("accent");

  return (
    <View className={cn("gap-1.5", className)}>
      <DensityProvider density="compact">
        <Text variant="headline" tone="muted">
          {label}
        </Text>
      </DensityProvider>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? undefined}
        placeholderTextColor={placeholderColor}
        selectionColor={caretColor}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={cn(
          "h-13 rounded-tile border bg-well px-4 text-body text-foreground",
          error ? "border-danger" : focused ? "border-accent" : "border-transparent",
        )}
      />
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
