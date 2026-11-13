import type { ReactNode } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

import { cn } from "#/shared/lib";

export function PhotoFrame({
  className,
  style,
  children,
}: {
  className?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View
      style={[{ borderCurve: "continuous" }, style]}
      className={cn("bg-paper shadow-rim p-0.5", className)}
    >
      {children}
    </View>
  );
}
