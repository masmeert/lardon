import type { RecipeDocument } from "../queries";
import { formatIngredient, formatMeta, hasIngredients, hasSteps, nutritionRows } from "./format";

export function escapeMarkdown(text: string) {
  return text
    .replace(/[\\`*_[\]<>|]/g, (character) => `\\${character}`)
    .replace(/^(\s*)([#>+-]|\d+[.)])(?=\s|$)/gm, (_, space: string, marker: string) =>
      marker.length > 1
        ? `${space}${marker.slice(0, -1)}\\${marker.slice(-1)}`
        : `${space}\\${marker}`,
    );
}

function listItem(text: string, indentation: number) {
  return escapeMarkdown(text).replace(/\n/g, `\n${" ".repeat(indentation)}`);
}

export function recipeToMarkdown(recipe: RecipeDocument) {
  const blocks: string[] = [`# ${escapeMarkdown(recipe.title)}`];

  const meta = formatMeta(recipe);

  if (meta) blocks.push(`*${meta}*`);

  if (recipe.tags.length > 0) {
    blocks.push(`**Tags:** ${recipe.tags.map(escapeMarkdown).join(", ")}`);
  }

  if (hasIngredients(recipe)) {
    blocks.push("## Ingredients");

    for (const section of recipe.ingredients) {
      if (section.ingredients.length === 0) continue;

      if (section.title) blocks.push(`### ${escapeMarkdown(section.title)}`);
      blocks.push(
        section.ingredients
          .map((ingredient) => `- ${listItem(formatIngredient(ingredient), 2)}`)
          .join("\n"),
      );
    }
  }

  if (hasSteps(recipe)) {
    blocks.push("## Steps");

    for (const section of recipe.steps) {
      if (section.steps.length === 0) continue;

      if (section.title) blocks.push(`### ${escapeMarkdown(section.title)}`);
      blocks.push(
        section.steps
          .map((step, index) => {
            const prefix = `${index + 1}. `;

            return `${prefix}${listItem(step.text, prefix.length)}`;
          })
          .join("\n"),
      );
    }
  }

  const nutrition = nutritionRows(recipe.nutrition);

  if (nutrition.length > 0) {
    blocks.push(
      [
        "## Nutrition (per serving)",
        "",
        "| Nutrient | Amount |",
        "| --- | ---: |",
        ...nutrition.map((row) => `| ${row.label} | ${row.value} |`),
      ].join("\n"),
    );
  }

  if (recipe.notes) {
    blocks.push(
      `## Notes\n\n${escapeMarkdown(recipe.notes).replace(/([^\n])\n(?=[^\n])/g, "$1  \n")}`,
    );
  }

  if (recipe.sourceUrl) {
    blocks.push(`Source: <${recipe.sourceUrl.replace(/[<>\s]/g, encodeURIComponent)}>`);
  }

  return `${blocks.join("\n\n")}\n`;
}
