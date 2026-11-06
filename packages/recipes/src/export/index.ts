import type { RecipeDocument } from "../queries";
import { recipeToMarkdown } from "./markdown";
import { type PdfPicture, recipeToPdf } from "./pdf";
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

export type ExportedFile = {
  filename: string;
  contentType: string;
  body: string | Uint8Array;
};

export function selectSections(
  recipe: RecipeDocument,
  include: readonly ExportSection[],
): RecipeDocument {
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

export async function exportRecipe(
  document: RecipeDocument,
  format: ExportFormat,
  options: { include?: readonly ExportSection[]; picture?: PdfPicture | null } = {},
): Promise<ExportedFile> {
  const recipe = selectSections(document, options.include ?? exportSections);
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
    case "pdf":
      return {
        filename: `${name}.pdf`,
        contentType: "application/pdf",
        body: await recipeToPdf(recipe, recipe.imageKey ? options.picture : null),
      };
  }
}
