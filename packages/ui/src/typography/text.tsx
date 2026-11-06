import { Text as NativeText, type TextProps as NativeTextProps } from "react-native";

import { cn } from "../class-names";
import { useDensity } from "../sizes/density-context";
import {
  maximumFontScales,
  textToneClassNames,
  typeRoleClassNames,
  type TextTone,
  type TypeRole,
} from "./type-roles";

export type TextProps = NativeTextProps & {
  variant?: TypeRole;
  tone?: TextTone;
  className?: string;
};

export function Text({ variant = "body", tone = "default", className, ...props }: TextProps) {
  const density = useDensity();

  return (
    <NativeText
      maxFontSizeMultiplier={maximumFontScales[variant]}
      {...props}
      className={cn(typeRoleClassNames[density][variant], textToneClassNames[tone], className)}
    />
  );
}
