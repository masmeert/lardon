import { type RecipeDetail, type UnitSystem, formatAmount } from "@lardon/recipes";
import { Pressable, Text } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { cn, motionMs } from "#/shared/lib";

export function IngredientRow({
  ingredient,
  scale,
  unitSystem,
  isFirst,
  isPickable,
  isPicked,
  onPick,
}: {
  ingredient: RecipeDetail["ingredients"][number];
  scale: number;
  unitSystem: UnitSystem;
  isFirst: boolean;
  isPickable: boolean;
  isPicked: boolean;
  onPick: () => void;
}) {
  const amount = formatAmount(ingredient, scale, unitSystem);

  return (
    <Pressable
      accessibilityRole={isPickable ? "radio" : undefined}
      accessibilityState={isPickable ? { checked: isPicked } : undefined}
      disabled={!isPickable || ingredient.quantity === undefined}
      onPress={onPick}
      className={cn(
        "min-h-11 flex-row items-center gap-3 py-2",
        !isFirst && "border-t border-hairline",
        isPickable && ingredient.quantity === undefined && "opacity-40",
      )}
    >
      {isPicked && (
        <Animated.View
          entering={FadeIn.duration(motionMs.fast)}
          exiting={FadeOut.duration(motionMs.exit)}
          pointerEvents="none"
          style={{ borderCurve: "continuous" }}
          className="absolute -inset-x-2.5 inset-y-0.5 rounded-inner border-[1.5px] border-accent"
        />
      )}
      <Text className="flex-1 text-body text-foreground">{ingredient.name}</Text>
      {amount !== "" && <Text className="text-body font-semibold text-accent">{amount}</Text>}
    </Pressable>
  );
}
