import { View, type ViewProps } from "react-native";

import { cn } from "../class-names";
import {
  elevate,
  surfaceClassNames,
  surfaceLevels,
  SurfaceLevelProvider,
  useSurfaceLevel,
} from "./surface-level";

export type SurfaceProps = ViewProps & {
  offset?: number;
  className?: string;
};

export function Surface({ offset = 1, className, ...props }: SurfaceProps) {
  const level = elevate(useSurfaceLevel(), offset);

  return (
    <SurfaceLevelProvider level={level}>
      <View
        {...props}
        className={cn(surfaceClassNames[surfaceLevels[level] ?? "background"], className)}
      />
    </SurfaceLevelProvider>
  );
}
