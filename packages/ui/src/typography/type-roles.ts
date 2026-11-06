import type { Density } from "../sizes/size-steps";

export type TypeRole = "display" | "title" | "headline" | "body" | "caption" | "micro";

export type TextTone =
  | "default"
  | "muted"
  | "accent"
  | "danger"
  | "success"
  | "on-accent"
  | "on-danger"
  | "on-disabled";

export const typeRoleClassNames = {
  default: {
    display: "text-display font-bold",
    title: "text-title font-semibold",
    headline: "text-headline font-semibold",
    body: "text-body font-normal",
    caption: "text-caption font-normal",
    micro: "text-micro font-normal",
  },
  compact: {
    display: "text-display-compact font-bold",
    title: "text-title-compact font-semibold",
    headline: "text-headline-compact font-semibold",
    body: "text-body-compact font-normal",
    caption: "text-caption-compact font-normal",
    micro: "text-micro font-normal",
  },
} satisfies Record<Density, Record<TypeRole, string>>;

export const textToneClassNames = {
  default: "text-foreground",
  muted: "text-muted",
  accent: "text-accent",
  danger: "text-danger",
  success: "text-success",
  "on-accent": "text-on-accent",
  "on-danger": "text-on-danger",
  "on-disabled": "text-on-disabled",
} satisfies Record<TextTone, string>;

export const maximumFontScales = {
  display: 1.4,
  title: 1.6,
  headline: undefined,
  body: undefined,
  caption: undefined,
  micro: 1.6,
} satisfies Record<TypeRole, number | undefined>;
