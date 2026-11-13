import type { Stored } from "@lardon/recipes";

import type { IconName } from "#/shared/ui";

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;

  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export function recipeFacts(recipe: Stored<"recipes">) {
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
  const facts: { icon: IconName; label: string }[] = [];

  if (recipe.servings !== undefined)
    facts.push({ icon: "person.2", label: String(recipe.servings) });

  if (totalMinutes > 0) facts.push({ icon: "clock", label: formatMinutes(totalMinutes) });

  return facts;
}
