import { type ComponentProps, type Ref, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { useThemeColors } from "#/shared/lib";
import { ClearButton } from "#/shared/ui";

export function FieldRow({
  label,
  prefix,
  isFirst,
  onFocus,
  onBlur,
  ...input
}: ComponentProps<typeof TextInput> & {
  label: string;
  prefix?: string;
  isFirst?: boolean;
  ref?: Ref<TextInput>;
}) {
  const { accent, muted } = useThemeColors("accent", "muted");
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="pl-4">
      {!isFirst && <View style={{ height: StyleSheet.hairlineWidth }} className="bg-hairline" />}
      <View className="min-h-13 flex-row items-center gap-2 pr-4">
        <Text className="w-24 text-title text-foreground">{label}</Text>
        <View className="flex-1 flex-row items-center">
          {prefix && <Text className="text-field text-muted">{prefix}</Text>}
          <TextInput
            accessibilityLabel={label}
            placeholderTextColor={muted}
            selectionColor={accent}
            onFocus={(event) => {
              setIsFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setIsFocused(false);
              onBlur?.(event);
            }}
            className="h-13 flex-1 text-field text-foreground"
            {...input}
          />
        </View>
        {isFocused && Boolean(input.value) && (
          <ClearButton onPress={() => input.onChangeText?.("")} />
        )}
      </View>
    </View>
  );
}
