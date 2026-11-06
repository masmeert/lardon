import type { SFSymbol } from "expo-symbols";
import { ActivityIndicator, View } from "react-native";

import { cn } from "../class-names";
import { Icon } from "../icon/icon";
import { DensityProvider, useDensity } from "../sizes/density-context";
import { controlSizes, type ControlSize } from "../sizes/size-steps";
import { Tappable, type TappableProps } from "../tappable/tappable";
import { Text } from "../typography/text";
import { useToneColor } from "../typography/tone-color";
import type { TextTone } from "../typography/type-roles";

export type ButtonVariant = "primary" | "secondary" | "plain" | "destructive";

const buttonVariants = {
  primary: {
    className: "bg-accent bg-accent-gradient shadow-accent",
    disabledClassName: "bg-disabled-gradient shadow-disabled",
    pressedClassName: "bg-pressed-fill",
    tone: "on-accent",
    disabledTone: "on-disabled",
  },
  secondary: {
    className: "bg-raised bg-control-gradient shadow-control",
    disabledClassName: "bg-raised bg-control-gradient shadow-control",
    pressedClassName: "bg-pressed",
    tone: "default",
    disabledTone: "muted",
  },
  plain: {
    className: "bg-transparent",
    disabledClassName: "bg-transparent",
    pressedClassName: "bg-pressed",
    tone: "accent",
    disabledTone: "muted",
  },
  destructive: {
    className: "bg-danger bg-danger-gradient shadow-danger",
    disabledClassName: "bg-disabled-gradient shadow-disabled",
    pressedClassName: "bg-pressed-fill",
    tone: "on-danger",
    disabledTone: "on-disabled",
  },
} satisfies Record<
  ButtonVariant,
  {
    className: string;
    disabledClassName: string;
    pressedClassName: string;
    tone: TextTone;
    disabledTone: TextTone;
  }
>;

export type ButtonProps = Omit<TappableProps, "children" | "overlay"> & {
  label: string;
  variant?: ButtonVariant;
  size?: ControlSize;
  icon?: SFSymbol;
  iconOnly?: boolean;
  loading?: boolean;
};

export function Button({
  label,
  variant = "primary",
  size,
  icon,
  iconOnly = false,
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const density = useDensity();
  const resolvedSize = size ?? density;
  const isDisabled = disabled === true;
  const control = controlSizes[resolvedSize];
  const appearance = buttonVariants[variant];
  const tone = isDisabled ? appearance.disabledTone : appearance.tone;
  const spinnerColor = useToneColor(tone);

  return (
    <DensityProvider density={resolvedSize === "compact" ? "compact" : "default"}>
      <Tappable
        accessibilityLabel={label}
        accessibilityState={{ busy: loading, disabled: isDisabled || loading }}
        {...props}
        overlay
        overlayClassName={cn("rounded-control", appearance.pressedClassName)}
        disabled={isDisabled || loading}
        hitSlop={control.hitSlopPt}
        className={cn(
          "flex-row items-center justify-center rounded-control",
          control.className,
          iconOnly && control.iconOnlyClassName,
          isDisabled ? appearance.disabledClassName : appearance.className,
          className,
        )}
      >
        <View className={cn("flex-row items-center gap-2", loading && "opacity-0")}>
          {icon ? (
            <Icon
              name={icon}
              tone={tone}
              size={iconOnly ? control.iconSizePt + 2 : control.iconSizePt}
            />
          ) : null}
          {iconOnly ? null : (
            <Text variant="headline" tone={tone} numberOfLines={1} maxFontSizeMultiplier={1.6}>
              {label}
            </Text>
          )}
        </View>
        {loading ? <ActivityIndicator className="absolute" color={spinnerColor} /> : null}
      </Tappable>
    </DensityProvider>
  );
}
