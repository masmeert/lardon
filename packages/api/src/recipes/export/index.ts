import type { AuthedContext } from "../../context";
import { type Recipe, getRecipe } from "../service";
import { recipeToMarkdown } from "./markdown";
import { recipeToPdf } from "./pdf";
import { recipeToText } from "./text";

export const exportFormats = ["text", "markdown", "pdf"] as const;
export type ExportFormat = (typeof exportFormats)[number];

export const exportSections = [
  "picture",
  "details",
  "tags",
  "ingredients",
  "steps",
  "nutrition",
  "notes",
  "source",
] as const;
export type ExportSection = (typeof exportSections)[number];

export function selectSections(recipe: Recipe, include: readonly ExportSection[]): Recipe {
  const included = new Set(include);
  return {
    ...recipe,
    imageKey: included.has("picture") ? recipe.imageKey : null,
    servings: included.has("details") ? recipe.servings : null,
    prepTimeMinutes: included.has("details") ? recipe.prepTimeMinutes : null,
    cookTimeMinutes: included.has("details") ? recipe.cookTimeMinutes : null,
    tags: included.has("tags") ? recipe.tags : [],
    ingredients: included.has("ingredients") ? recipe.ingredients : [],
    steps: included.has("steps") ? recipe.steps : [],
    nutrition: included.has("nutrition") ? recipe.nutrition : null,
    notes: included.has("notes") ? recipe.notes : null,
    sourceUrl: included.has("source") ? recipe.sourceUrl : null,
  };
}

export type ExportedFile = {
  filename: string;
  contentType: string;
  body: string | Uint8Array;
};

export async function exportRecipe(
  context: AuthedContext,
  id: string,
  format: ExportFormat,
  include: readonly ExportSection[] = exportSections,
): Promise<ExportedFile> {
  const recipe = selectSections(await getRecipe(context, id), include);
  const name =
    recipe.title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "recipe";

  switch (format) {
    case "text":
      return {
        filename: `${name}.txt`,
        contentType: "text/plain; charset=utf-8",
        body: recipeToText(recipe),
      };
    case "markdown":
      return {
        filename: `${name}.md`,
        contentType: "text/markdown; charset=utf-8",
        body: recipeToMarkdown(recipe),
      };
    case "pdf": {
      const stored = recipe.imageKey ? await context.images.get(recipe.imageKey) : null;
      return {
        filename: `${name}.pdf`,
        contentType: "application/pdf",
        body: await recipeToPdf(
          recipe,
          stored && {
            bytes: new Uint8Array(await stored.arrayBuffer()),
            contentType: stored.contentType,
          },
        ),
      };
    }
  }
}
