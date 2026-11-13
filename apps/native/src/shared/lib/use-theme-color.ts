import { useCSSVariable } from "uniwind";

export function useThemeColor(
  name: "white" | "background" | "foreground" | "muted" | "danger" | "bacon" | "splash",
) {
  return String(useCSSVariable(`--color-${name}`) ?? "");
}
