import { createContext, useContext, type PropsWithChildren } from "react";

export const surfaceLevels = ["background", "raised", "floating"] as const;

export type SurfaceLevel = (typeof surfaceLevels)[number];

export const surfaceClassNames = {
  background: "bg-background",
  raised: "bg-raised shadow-raised border border-hairline",
  floating: "bg-floating shadow-floating border border-hairline",
} satisfies Record<SurfaceLevel, string>;

const SurfaceLevelContext = createContext(0);

export function SurfaceLevelProvider({ level, children }: PropsWithChildren<{ level: number }>) {
  return <SurfaceLevelContext value={level}>{children}</SurfaceLevelContext>;
}

export function useSurfaceLevel() {
  return useContext(SurfaceLevelContext);
}

export function elevate(substrateLevel: number, offset: number) {
  return Math.max(0, Math.min(substrateLevel + offset, surfaceLevels.length - 1));
}

export function nestedRadius(outerRadiusPt: number, insetPt: number, borderWidthPt = 0) {
  return Math.max(0, outerRadiusPt - insetPt - borderWidthPt);
}
