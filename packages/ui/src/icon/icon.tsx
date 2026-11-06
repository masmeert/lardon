import { SymbolView, type SymbolViewProps } from "expo-symbols";

import { controlSizes } from "../sizes/size-steps";
import { useDensity } from "../sizes/density-context";
import { useToneColor } from "../typography/tone-color";
import type { TextTone } from "../typography/type-roles";

export type IconProps = Omit<SymbolViewProps, "tintColor"> & {
  tone?: TextTone;
};

export function Icon({ tone = "default", size, weight = "medium", ...props }: IconProps) {
  const density = useDensity();

  return (
    <SymbolView
      {...props}
      weight={weight}
      size={size ?? controlSizes[density].iconSizePt}
      tintColor={useToneColor(tone)}
    />
  );
}
