import { useCSSVariable } from "uniwind";

type ThemeColor =
  | "white"
  | "background"
  | "foreground"
  | "muted"
  | "accent"
  | "danger"
  | "bacon"
  | "splash"
  | "placeholder";

export function useThemeColors<Name extends ThemeColor>(...names: Name[]) {
  const values = useCSSVariable(names.map((name) => `--color-${name}`));

  // SAFETY: fromEntries pairs every requested name with its value, so each key of Name is present.
  return Object.fromEntries(
    names.map((name, index) => [name, String(values[index] ?? "")]),
  ) as Record<Name, string>;
}
