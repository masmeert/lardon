import type { Recipe } from "../service";
import { formatIngredient, formatMeta, hasIngredients, hasSteps, nutritionRows } from "./format";

function indent(text: string, spaces: number) {
  return text.replace(/\n/g, `\n${" ".repeat(spaces)}`);
}

export function recipeToText(recipe: Recipe) {
  const blocks: string[] = [];

  const header = [recipe.title.toUpperCase()];
  const meta = formatMeta(recipe);
  if (meta) header.push(meta);
  if (recipe.tags.length > 0) header.push(`Tags: ${recipe.tags.join(", ")}`);
  blocks.push(header.join("\n"));

  if (hasIngredients(recipe)) {
    const lines = ["INGREDIENTS"];
    for (const section of recipe.ingredients) {
      if (section.ingredients.length === 0) continue;
      if (section.title) lines.push("", section.title);
      for (const ingredient of section.ingredients) {
        lines.push(`• ${indent(formatIngredient(ingredient), 2)}`);
      }
    }
    blocks.push(lines.join("\n"));
  }

  if (hasSteps(recipe)) {
    const lines = ["STEPS"];
    for (const section of recipe.steps) {
      if (section.steps.length === 0) continue;
      if (section.title) lines.push("", section.title);
      section.steps.forEach((step, index) => {
        const prefix = `${index + 1}. `;
        lines.push(`${prefix}${indent(step.text, prefix.length)}`);
      });
    }
    blocks.push(lines.join("\n"));
  }

  const nutrition = nutritionRows(recipe.nutrition);
  if (nutrition.length > 0) {
    blocks.push(
      ["NUTRITION (per serving)", ...nutrition.map((row) => `${row.label}: ${row.value}`)].join(
        "\n",
      ),
    );
  }

  if (recipe.notes) blocks.push(`NOTES\n${recipe.notes}`);
  if (recipe.sourceUrl) blocks.push(`Source: ${recipe.sourceUrl}`);

  return `${blocks.join("\n\n")}\n`;
}
