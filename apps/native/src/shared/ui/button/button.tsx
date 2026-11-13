import type { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

import { cn, useThemeColors } from "#/shared/lib";

import { Glass } from "../glass";
import { PressableScale } from "../pressable-scale";

import { type ButtonVariant, ButtonVariantContext } from "./button-variant";

export function Button({
  variant = "primary",
  size = "lg",
  isIconOnly = false,
  isDisabled = false,
  isLoading = false,
  accessibilityLabel,
  onPress,
  className,
  children,
}: {
  variant?: ButtonVariant;
  size?: "md" | "lg";
  isIconOnly?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
  className?: string;
  children: ReactNode;
}) {
  const colors = useThemeColors("white", "foreground", "accent", "danger");

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled || isLoading}
      onPress={onPress}
      className={cn(
        "flex-row items-center justify-center rounded-full",
        size === "lg" && (isIconOnly ? "size-control-lg" : "h-control-lg px-5"),
        size === "md" && (isIconOnly ? "size-control" : "h-control px-4"),
        isDisabled && "opacity-50",
        className,
      )}
    >
      <Glass
        isInteractive
        tintColor={{ primary: colors.accent, secondary: undefined, danger: colors.danger }[variant]}
        className="absolute inset-0 rounded-full"
      />
      <ButtonVariantContext value={variant}>
        <View
          pointerEvents="none"
          className={cn("flex-row items-center gap-1.5", isLoading && "opacity-0")}
        >
          {children}
        </View>
      </ButtonVariantContext>
      {isLoading && (
        <ActivityIndicator
          color={variant === "secondary" ? colors.foreground : colors.white}
          className="absolute"
        />
      )}
    </PressableScale>
  );
}
