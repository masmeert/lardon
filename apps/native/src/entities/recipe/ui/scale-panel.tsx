import { Button, Host, Picker, Slider, Text as SwiftText } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  disabled,
  font,
  foregroundStyle,
  labelStyle,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { type UnitCode, amountInput } from "@lardon/recipes";
import { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import Animated, { LinearTransition, ZoomIn, ZoomOut } from "react-native-reanimated";

import { iconSize, motionMs, useThemeColors } from "#/shared/lib";
import { Icon } from "#/shared/ui";

const AnimatedHost = Animated.createAnimatedComponent(Host);

export type ScaleMode = "amount" | "servings" | "ingredient";

function decimalText(value: number) {
  return String(Math.round(value * 100) / 100);
}

export function ScalePanel({
  servings,
  factor,
  onFactorChange,
  mode,
  onModeChange,
  scaledIngredient,
  onClear,
}: {
  servings: number | undefined;
  factor: number;
  onFactorChange: (factor: number) => void;
  mode: ScaleMode;
  onModeChange: (mode: ScaleMode) => void;
  scaledIngredient: { name: string; quantity: number; unit?: UnitCode } | undefined;
  onClear: () => void;
}) {
  const { accent, muted } = useThemeColors("accent", "muted");
  const [amountText, setAmountText] = useState<string | null>(null);
  const valueInput = useRef<TextInput>(null);
  const rowTransition = LinearTransition.duration(motionMs.moderate);
  const isReset = factor === 1 && scaledIngredient === undefined;

  const field =
    mode === "ingredient"
      ? scaledIngredient && {
          base: scaledIngredient.quantity,
          label: `How much ${scaledIngredient.name} you have`,
        }
      : mode === "servings" && servings !== undefined
        ? { base: servings, label: "Servings" }
        : { base: 1, label: "Scale factor" };

  const scaledIngredientName = scaledIngredient?.name;

  useEffect(() => {
    if (!scaledIngredientName) return;

    const focusTimer = setTimeout(() => valueInput.current?.focus(), motionMs.moderate);

    return () => clearTimeout(focusTimer);
  }, [scaledIngredientName]);

  const steps =
    mode === "servings" && servings !== undefined
      ? Array.from({ length: Math.max(12, servings * 4) }, (_, step) => (step + 1) / servings)
      : [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10];

  const nearestIndex = steps.reduce(
    (best, step, index) =>
      Math.abs(step - factor) < Math.abs((steps[best] ?? 1) - factor) ? index : best,
    0,
  );

  return (
    <View style={{ borderCurve: "continuous" }} className="gap-3 rounded-card bg-paper p-3">
      <Host ignoreSafeArea="all" style={{ height: 32 }}>
        <Picker
          selection={mode}
          onSelectionChange={(selection: ScaleMode) => {
            onModeChange(selection);
            setAmountText(null);
          }}
          modifiers={[pickerStyle("segmented")]}
        >
          <SwiftText modifiers={[tag("amount")]}>Amount</SwiftText>
          {servings !== undefined && <SwiftText modifiers={[tag("servings")]}>Servings</SwiftText>}
          <SwiftText modifiers={[tag("ingredient")]}>Ingredient</SwiftText>
        </Picker>
      </Host>
      <View className="h-10 flex-row items-center gap-2.5 pl-1">
        <AnimatedHost layout={rowTransition} ignoreSafeArea="all" style={{ height: 32, flex: 1 }}>
          <Slider
            value={nearestIndex}
            min={0}
            max={steps.length - 1}
            step={1}
            onValueChange={(index) => {
              setAmountText(null);
              onFactorChange(steps[Math.round(index)] ?? 1);
            }}
            modifiers={[tint(accent), disabled(mode === "ingredient" && !scaledIngredient)]}
          />
        </AnimatedHost>
        <Animated.View
          layout={rowTransition}
          style={{ borderCurve: "continuous" }}
          className="h-control w-24 flex-row items-center gap-1.5 rounded-inner bg-background px-3"
        >
          {field ? (
            <>
              {mode === "amount" && <Text className="text-title text-muted">×</Text>}
              {mode === "servings" && <Icon name="person.2" size={iconSize.md} color={muted} />}
              <TextInput
                key={scaledIngredient?.name ?? mode}
                ref={valueInput}
                value={amountText ?? decimalText(field.base * factor)}
                onChangeText={(text) => {
                  const typed = amountInput(text);
                  const amount = Number(typed.replace(",", "."));

                  setAmountText(typed);

                  if (amount > 0) onFactorChange(amount / field.base);
                }}
                onBlur={() => setAmountText(null)}
                keyboardType="decimal-pad"
                selectTextOnFocus
                selectionColor={accent}
                accessibilityLabel={field.label}
                className="flex-1 text-title font-semibold text-accent"
              />
              {mode === "ingredient" && scaledIngredient?.unit && (
                <Text className="text-body text-muted">{scaledIngredient.unit}</Text>
              )}
            </>
          ) : (
            <Text className="flex-1 text-body font-medium text-muted">Pick one</Text>
          )}
        </Animated.View>
        {!isReset && (
          <Animated.View
            entering={ZoomIn.duration(motionMs.fast)}
            exiting={ZoomOut.duration(motionMs.exit)}
          >
            <Host ignoreSafeArea="all" style={{ width: 18, height: 18 }}>
              <Button
                label="Back to the original amounts"
                systemImage="xmark.circle.fill"
                onPress={() => {
                  setAmountText(null);
                  onClear();
                }}
                modifiers={[
                  buttonStyle("plain"),
                  labelStyle("iconOnly"),
                  font({ size: 17 }),
                  foregroundStyle(muted),
                ]}
              />
            </Host>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
