import { useColor } from "../color/use-color";
import type { TextTone } from "./type-roles";

export function useToneColor(tone: TextTone) {
  return useColor(tone === "default" ? "foreground" : tone);
}
