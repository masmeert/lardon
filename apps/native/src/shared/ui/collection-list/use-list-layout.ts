import { Schema } from "effect";

import { usePreference } from "#/shared/preferences";

export function useListLayout() {
  return usePreference("listLayout", Schema.Literals(["list", "grid"]), "list");
}
