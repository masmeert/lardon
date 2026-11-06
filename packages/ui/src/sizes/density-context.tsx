import { createContext, useContext, type PropsWithChildren } from "react";

import type { Density } from "./size-steps";

const DensityContext = createContext<Density>("default");

export function DensityProvider({ density, children }: PropsWithChildren<{ density: Density }>) {
  return <DensityContext value={density}>{children}</DensityContext>;
}

export function useDensity() {
  return useContext(DensityContext);
}
