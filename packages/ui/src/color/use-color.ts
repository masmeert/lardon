import { useCSSVariable } from "uniwind";

export type ColorToken =
  | "background"
  | "raised"
  | "floating"
  | "foreground"
  | "muted"
  | "hairline"
  | "accent"
  | "on-accent"
  | "danger"
  | "on-danger"
  | "on-disabled"
  | "success";

export function useColor(token: ColorToken) {
  const color = useCSSVariable(`--${token}`);

  return color === undefined ? undefined : String(color);
}
