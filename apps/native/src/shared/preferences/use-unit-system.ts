import { Schema } from "effect";

import { usePreference } from "./use-preference";

export function useUnitSystem() {
  return usePreference(
    "unitSystem",
    Schema.Literals(["original", "metric", "imperial"]),
    "original",
  );
}
