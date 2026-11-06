export type Density = "default" | "compact";

export type ControlSize = Density | "large";

export const controlSizes = {
  large: {
    heightPt: 52,
    className: "h-13 px-6 gap-2",
    iconOnlyClassName: "h-13 w-13 px-0",
    iconSizePt: 19,
    hitSlopPt: 0,
  },
  default: {
    heightPt: 44,
    className: "h-11 px-5 gap-2",
    iconOnlyClassName: "h-11 w-11 px-0",
    iconSizePt: 17,
    hitSlopPt: 0,
  },
  compact: {
    heightPt: 32,
    className: "h-8 px-3.5 gap-1.5",
    iconOnlyClassName: "h-8 w-8 px-0",
    iconSizePt: 15,
    hitSlopPt: 6,
  },
} satisfies Record<
  ControlSize,
  {
    heightPt: number;
    className: string;
    iconOnlyClassName: string;
    iconSizePt: number;
    hitSlopPt: number;
  }
>;

export const regionGaps = {
  default: "gap-3",
  compact: "gap-2",
} satisfies Record<Density, string>;
