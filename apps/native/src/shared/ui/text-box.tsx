import { type ComponentProps, type Ref, useState } from "react";
import { Pressable, TextInput } from "react-native";

import { cn, iconSize, useThemeColors } from "#/shared/lib";

import { Glass } from "./glass";
import { Icon } from "./icon";

export function TextBox({
  className,
  clearButtonMode,
  onFocus,
  onBlur,
  ...props
}: ComponentProps<typeof TextInput> & { className?: string; ref?: Ref<TextInput> }) {
  const { accent, muted } = useThemeColors("accent", "muted");
  const [isFocused, setIsFocused] = useState(false);

  const canClear =
    clearButtonMode === "while-editing" &&
    isFocused &&
    Boolean(props.value) &&
    props.editable !== false;

  return (
    <Glass
      style={{ borderCurve: "continuous" }}
      className={cn("h-13 flex-row items-center rounded-[26px]", className)}
    >
      <TextInput
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
        className={cn(
          "h-full flex-1 pl-5 text-field font-normal text-foreground",
          canClear ? "pr-2" : "pr-5",
        )}
        {...props}
      />
      {canClear && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear"
          hitSlop={12}
          onPress={() => props.onChangeText?.("")}
          className="mr-4 size-5 items-center justify-center rounded-full bg-accent-soft"
        >
          <Icon name="xmark" size={iconSize.xs} color={accent} />
        </Pressable>
      )}
    </Glass>
  );
}
