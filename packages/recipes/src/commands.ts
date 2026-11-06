import { type Store, nanoid } from "@livestore/livestore";
import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

import { type Nutrition, type SectionKind, recipeEvents } from "./events";
import { type RecipeDocument, readRecipeDocument, recipe$, recipeSections$ } from "./queries";
import { type RecipeSchema, recipeTables } from "./schema";

type RecipeStore = Store<RecipeSchema>;

export type IngredientInput = {
  quantity?: number | null;
  unit?: string | null;
  name: string;
  note?: string | null;
};

export type RecipeDetails = {
  title?: string;
  servings?: number | null;
  servingsUnit?: string | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  notes?: string | null;
  sourceUrl?: string | null;
};

export type NewRecipe = Partial<RecipeDocument> & { title: string; createdById: string };

function cleanText(value: string | null | undefined) {
  return value?.trim() || null;
}

function positionAt(siblingPositions: readonly string[], index: number) {
  const clampedIndex = Math.max(0, Math.min(index, siblingPositions.length));

  return generateKeyBetween(
    siblingPositions[clampedIndex - 1] ?? null,
    siblingPositions[clampedIndex] ?? null,
  );
}

function cleanIngredient(ingredient: IngredientInput) {
  return {
    quantity: ingredient.quantity ?? null,
    unit: cleanText(ingredient.unit),
    name: ingredient.name.trim(),
    note: cleanText(ingredient.note),
  };
}

export function createRecipe(store: RecipeStore, recipe: NewRecipe) {
  const recipeId = nanoid();

  const ingredientSections = recipe.ingredients?.length
    ? recipe.ingredients
    : [{ title: null, ingredients: [] }];

  const stepSections = recipe.steps?.length ? recipe.steps : [{ title: null, steps: [] }];
  const ingredientSectionPositions = generateNKeysBetween(null, null, ingredientSections.length);
  const stepSectionPositions = generateNKeysBetween(null, null, stepSections.length);

  store.commit(
    recipeEvents.recipeCreated({
      recipeId,
      title: recipe.title.trim(),
      servings: recipe.servings ?? null,
      servingsUnit: cleanText(recipe.servingsUnit),
      prepTimeMinutes: recipe.prepTimeMinutes ?? null,
      cookTimeMinutes: recipe.cookTimeMinutes ?? null,
      notes: cleanText(recipe.notes),
      sourceUrl: cleanText(recipe.sourceUrl),
      imageKey: recipe.imageKey ?? null,
      nutrition: recipe.nutrition ?? null,
      tags: (recipe.tags ?? [])
        .map((tag) => tag.trim())
        .filter(
          (tag, index, all) =>
            tag && all.findIndex((other) => other.toLowerCase() === tag.toLowerCase()) === index,
        ),
      ingredientSections: ingredientSections.map((section, sectionIndex) => {
        const positions = generateNKeysBetween(null, null, section.ingredients.length);

        return {
          sectionId: nanoid(),
          position: ingredientSectionPositions[sectionIndex]!,
          title: cleanText(section.title),
          ingredients: section.ingredients.map((ingredient, index) => ({
            ingredientId: nanoid(),
            position: positions[index]!,
            ...cleanIngredient(ingredient),
          })),
        };
      }),
      stepSections: stepSections.map((section, sectionIndex) => {
        const positions = generateNKeysBetween(null, null, section.steps.length);

        return {
          sectionId: nanoid(),
          position: stepSectionPositions[sectionIndex]!,
          title: cleanText(section.title),
          steps: section.steps.map((step, index) => ({
            stepId: nanoid(),
            position: positions[index]!,
            text: step.text.trim(),
          })),
        };
      }),
      createdById: recipe.createdById,
      createdAt: new Date(),
    }),
  );

  return recipeId;
}

export function updateRecipeDetails(store: RecipeStore, recipeId: string, details: RecipeDetails) {
  store.commit(
    recipeEvents.recipeDetailsUpdated({
      recipeId,
      updatedAt: new Date(),
      ...(details.title !== undefined && { title: details.title.trim() }),
      ...(details.servings !== undefined && { servings: details.servings }),
      ...(details.servingsUnit !== undefined && { servingsUnit: cleanText(details.servingsUnit) }),
      ...(details.prepTimeMinutes !== undefined && { prepTimeMinutes: details.prepTimeMinutes }),
      ...(details.cookTimeMinutes !== undefined && { cookTimeMinutes: details.cookTimeMinutes }),
      ...(details.notes !== undefined && { notes: cleanText(details.notes) }),
      ...(details.sourceUrl !== undefined && { sourceUrl: cleanText(details.sourceUrl) }),
    }),
  );
}

export function setRecipeNutrition(
  store: RecipeStore,
  recipeId: string,
  nutrition: Nutrition | null,
) {
  store.commit(recipeEvents.recipeNutritionSet({ recipeId, nutrition, updatedAt: new Date() }));
}

export function addRecipeTag(store: RecipeStore, recipeId: string, tag: string) {
  if (!tag.trim()) return;
  store.commit(recipeEvents.recipeTagAdded({ recipeId, tag: tag.trim(), updatedAt: new Date() }));
}

export function removeRecipeTag(store: RecipeStore, recipeId: string, tag: string) {
  store.commit(recipeEvents.recipeTagRemoved({ recipeId, tag, updatedAt: new Date() }));
}

export function setRecipeImage(store: RecipeStore, recipeId: string, imageKey: string | null) {
  store.commit(recipeEvents.recipeImageSet({ recipeId, imageKey, updatedAt: new Date() }));
}

export function deleteRecipe(store: RecipeStore, recipeId: string) {
  store.commit(recipeEvents.recipeDeleted({ recipeId, deletedAt: new Date() }));
}

export function addRecipeSection(
  store: RecipeStore,
  recipeId: string,
  kind: SectionKind,
  title: string | null = null,
) {
  const sectionId = nanoid();

  const positions = store
    .query(recipeSections$(recipeId))
    .filter((section) => section.kind === kind)
    .map((section) => section.position);

  store.commit(
    recipeEvents.recipeSectionAdded({
      recipeId,
      sectionId,
      kind,
      title: cleanText(title),
      position: positionAt(positions, positions.length),
      updatedAt: new Date(),
    }),
  );

  return sectionId;
}

export function renameRecipeSection(
  store: RecipeStore,
  recipeId: string,
  sectionId: string,
  title: string | null,
) {
  store.commit(
    recipeEvents.recipeSectionRenamed({
      recipeId,
      sectionId,
      title: cleanText(title),
      updatedAt: new Date(),
    }),
  );
}

export function moveRecipeSection(
  store: RecipeStore,
  recipeId: string,
  sectionId: string,
  index: number,
) {
  const sections = store.query(recipeSections$(recipeId));
  const kind = sections.find((section) => section.id === sectionId)?.kind;
  store.commit(
    recipeEvents.recipeSectionMoved({
      recipeId,
      sectionId,
      position: positionAt(
        sections
          .filter((section) => section.kind === kind && section.id !== sectionId)
          .map((section) => section.position),
        index,
      ),
      updatedAt: new Date(),
    }),
  );
}

export function removeRecipeSection(store: RecipeStore, recipeId: string, sectionId: string) {
  store.commit(recipeEvents.recipeSectionRemoved({ recipeId, sectionId, deletedAt: new Date() }));
}

function siblingPositions(
  store: RecipeStore,
  kind: SectionKind,
  sectionId: string,
  excludedId?: string,
) {
  const rows =
    kind === "ingredients"
      ? store.query(
          recipeTables.ingredients
            .select("id", "position")
            .where({ sectionId, deletedAt: null })
            .orderBy("position", "asc"),
        )
      : store.query(
          recipeTables.steps
            .select("id", "position")
            .where({ sectionId, deletedAt: null })
            .orderBy("position", "asc"),
        );

  return rows.filter((row) => row.id !== excludedId).map((row) => row.position);
}

export function addIngredient(
  store: RecipeStore,
  recipeId: string,
  sectionId: string,
  ingredient: IngredientInput,
) {
  const ingredientId = nanoid();
  const positions = siblingPositions(store, "ingredients", sectionId);
  store.commit(
    recipeEvents.ingredientAdded({
      recipeId,
      sectionId,
      ingredientId,
      position: positionAt(positions, positions.length),
      ...cleanIngredient(ingredient),
      updatedAt: new Date(),
    }),
  );

  return ingredientId;
}

export function updateIngredient(
  store: RecipeStore,
  recipeId: string,
  ingredientId: string,
  changes: Partial<IngredientInput>,
) {
  store.commit(
    recipeEvents.ingredientUpdated({
      recipeId,
      ingredientId,
      updatedAt: new Date(),
      ...(changes.quantity !== undefined && { quantity: changes.quantity }),
      ...(changes.unit !== undefined && { unit: cleanText(changes.unit) }),
      ...(changes.name !== undefined && { name: changes.name.trim() }),
      ...(changes.note !== undefined && { note: cleanText(changes.note) }),
    }),
  );
}

export function moveIngredient(
  store: RecipeStore,
  recipeId: string,
  ingredientId: string,
  sectionId: string,
  index: number,
) {
  store.commit(
    recipeEvents.ingredientMoved({
      recipeId,
      ingredientId,
      sectionId,
      position: positionAt(siblingPositions(store, "ingredients", sectionId, ingredientId), index),
      updatedAt: new Date(),
    }),
  );
}

export function removeIngredient(store: RecipeStore, recipeId: string, ingredientId: string) {
  store.commit(recipeEvents.ingredientRemoved({ recipeId, ingredientId, deletedAt: new Date() }));
}

export function addStep(store: RecipeStore, recipeId: string, sectionId: string, text: string) {
  const stepId = nanoid();
  const positions = siblingPositions(store, "steps", sectionId);
  store.commit(
    recipeEvents.stepAdded({
      recipeId,
      sectionId,
      stepId,
      position: positionAt(positions, positions.length),
      text: text.trim(),
      updatedAt: new Date(),
    }),
  );

  return stepId;
}

export function editStep(store: RecipeStore, recipeId: string, stepId: string, text: string) {
  store.commit(
    recipeEvents.stepEdited({ recipeId, stepId, text: text.trim(), updatedAt: new Date() }),
  );
}

export function moveStep(
  store: RecipeStore,
  recipeId: string,
  stepId: string,
  sectionId: string,
  index: number,
) {
  store.commit(
    recipeEvents.stepMoved({
      recipeId,
      stepId,
      sectionId,
      position: positionAt(siblingPositions(store, "steps", sectionId, stepId), index),
      updatedAt: new Date(),
    }),
  );
}

export function removeStep(store: RecipeStore, recipeId: string, stepId: string) {
  store.commit(recipeEvents.stepRemoved({ recipeId, stepId, deletedAt: new Date() }));
}

export type CopyOverrides = { imageKey?: string | null };

export function copyRecipe(
  source: RecipeStore,
  target: RecipeStore,
  recipeId: string,
  createdById: string,
  overrides: CopyOverrides = {},
) {
  const document = readRecipeDocument(source, recipeId);

  if (!document) return null;

  return createRecipe(target, {
    ...document,
    ...overrides,
    title: source === target ? `${document.title} (copy)` : document.title,
    createdById,
  });
}

export function moveRecipe(
  source: RecipeStore,
  target: RecipeStore,
  recipeId: string,
  createdById: string,
  overrides: CopyOverrides = {},
) {
  if (source === target || !source.query(recipe$(recipeId))) return recipeId;
  const movedId = copyRecipe(source, target, recipeId, createdById, overrides);

  if (movedId) deleteRecipe(source, recipeId);

  return movedId;
}
