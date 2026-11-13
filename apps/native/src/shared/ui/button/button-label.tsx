import { use } from "react";
import { Text } from "react-native";

import { cn } from "#/shared/lib";

import { ButtonVariantContext } from "./button-variant";

export function ButtonLabel({ children }: { children: string }) {
  const variant = use(ButtonVariantContext);

  return (
    <Text
      className={cn(
        "text-body font-semibold",
        variant === "secondary" ? "text-foreground" : "text-white",
      )}
    >
      {children}
    </Text>
  );
}
