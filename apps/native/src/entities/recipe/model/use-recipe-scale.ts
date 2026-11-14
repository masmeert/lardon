import type { UnitCode } from "@lardon/recipes";
import { Schema } from "effect";
import { useState } from "react";

import { usePreference } from "#/shared/preferences";

import type { ScaleMode } from "../ui/scale-panel";

export function useRecipeScale(initialScale = 1) {
  const [factor, setFactor] = useState(initialScale);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ScaleMode>("amount");
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const isPicking = isOpen && mode === "ingredient";

  const [unitSystem, setUnitSystem] = usePreference(
    "unitSystem",
    Schema.Literals(["original", "metric", "imperial"]),
    "original",
  );

  return {
    factor,
    unitSystem,
    isOpen,
    pickedKey,
    controls: {
      scaleFactor: factor,
      onScalePress: () => setIsOpen(!isOpen),
      unitSystem,
      onUnitSystemChange: setUnitSystem,
    },
    panel: (
      servings: number | undefined,
      picked: { name: string; quantity?: number; unit?: UnitCode } | undefined,
    ) => ({
      servings,
      factor,
      onFactorChange: setFactor,
      mode,
      onModeChange: setMode,
      scaledIngredient:
        picked?.quantity === undefined
          ? undefined
          : { name: picked.name, quantity: picked.quantity, unit: picked.unit },
      onClear: () => {
        setFactor(1);
        setPickedKey(null);
      },
    }),
    pick: (key: string) => ({
      isPickable: isPicking,
      isPicked: isPicking && pickedKey === key,
      onPick: () => setPickedKey(key),
    }),
  };
}
