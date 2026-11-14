import { formatAmount, formatFacts } from "./format";
import type { RecipeSnapshot } from "./snapshot";
import type { UnitSystem } from "./units";

export function recipeMarkdown(
  recipe: RecipeSnapshot,
  scale = 1,
  unitSystem: UnitSystem = "original",
) {
  const facts = formatFacts(recipe, scale);

  return [
    `# ${recipe.title}`,
    facts.length > 0 ? facts.join(", ") : null,
    recipe.ingredients.length > 0
      ? [
          "## Ingredients",
          recipe.ingredients
            .map(
              (ingredient) =>
                `- ${[formatAmount(ingredient, scale, unitSystem), ingredient.name].filter(Boolean).join(" ")}`,
            )
            .join("\n"),
        ].join("\n\n")
      : null,
    recipe.steps.length > 0
      ? ["## Steps", recipe.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")].join(
          "\n\n",
        )
      : null,
    recipe.notes ? `## Notes\n\n${recipe.notes}` : null,
  ]
    .filter((block) => block !== null)
    .join("\n\n")
    .concat("\n");
}
