import { type Stored, formatDuration } from "@lardon/recipes";

import type { IconName } from "#/shared/ui";

export function recipeFacts(recipe: Stored<"recipes">) {
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
  const facts: { icon: IconName; label: string }[] = [];

  if (recipe.servings !== undefined)
    facts.push({ icon: "person.2", label: String(recipe.servings) });

  if (totalMinutes > 0) facts.push({ icon: "clock", label: formatDuration(totalMinutes) });

  return facts;
}
