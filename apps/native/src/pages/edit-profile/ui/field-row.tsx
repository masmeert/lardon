import type { ComponentProps, Ref } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { useThemeColors } from "#/shared/lib";

export function FieldRow({
  label,
  prefix,
  isFirst,
  ...input
}: ComponentProps<typeof TextInput> & {
  label: string;
  prefix?: string;
  isFirst?: boolean;
  ref?: Ref<TextInput>;
}) {
  const { accent, muted } = useThemeColors("accent", "muted");

  return (
    <View className="pl-4">
      {!isFirst && <View style={{ height: StyleSheet.hairlineWidth }} className="bg-hairline" />}
      <View className="min-h-13 flex-row items-center pr-4">
        <Text className="w-26 text-title text-foreground">{label}</Text>
        {prefix && <Text className="text-field text-muted">{prefix}</Text>}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={muted}
          selectionColor={accent}
          clearButtonMode="while-editing"
          className="h-13 flex-1 text-field text-foreground"
          {...input}
        />
      </View>
    </View>
  );
}
