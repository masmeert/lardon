import { type ComponentProps, type Ref, useState } from "react";
import { TextInput } from "react-native";

import { cn, useThemeColor } from "#/shared/lib";

export function TextBox({
  className,
  onFocus,
  onBlur,
  ...props
}: ComponentProps<typeof TextInput> & { className?: string; ref?: Ref<TextInput> }) {
  const mutedColor = useThemeColor("muted");
  const foregroundColor = useThemeColor("foreground");
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={mutedColor}
      selectionColor={foregroundColor}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      className={cn(
        "h-control rounded-full border-[1.5px] border-transparent bg-fill px-4 font-normal text-body text-foreground",
        isFocused && "border-accent bg-paper",
        className,
      )}
      {...props}
    />
  );
}
