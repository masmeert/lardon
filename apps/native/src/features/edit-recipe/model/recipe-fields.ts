import {
  type DraftIngredient,
  type DraftStep,
  type RecipeDetail,
  type UnitCode,
  amountInput,
} from "@lardon/recipes";
import { getUniqueId } from "tinybase";

export type IngredientFields = { id: string; amount: string; unit: UnitCode | null; name: string };

export type RecipeFields = {
  title: string;
  servings: string;
  prepMinutes: string;
  cookMinutes: string;
  notes: string;
  photoUri: string | null;
  imageKey: string | null;
  ingredients: readonly IngredientFields[];
  steps: readonly DraftStep[];
  folderNames: readonly string[];
  tagNames: readonly string[];
  isPrivate: boolean;
};

export type EditorBase = {
  familyId: string | null;
  fields: RecipeFields;
  ingredients: readonly DraftIngredient[];
};

function numberText(value: number | undefined) {
  return value === undefined ? "" : String(value);
}

export function amountText(quantity: number) {
  return amountInput(String(Math.round(quantity * 100) / 100));
}

export function newIngredient(): IngredientFields {
  return { id: getUniqueId(), amount: "", unit: null, name: "" };
}

export function newStep(): DraftStep {
  return { id: getUniqueId(), text: "" };
}

export function emptyBase(isPrivate: boolean): EditorBase {
  return {
    familyId: null,
    fields: {
      title: "",
      servings: "",
      prepMinutes: "",
      cookMinutes: "",
      notes: "",
      photoUri: null,
      imageKey: null,
      ingredients: [],
      steps: [],
      folderNames: [],
      tagNames: [],
      isPrivate,
    },
    ingredients: [],
  };
}

export function recipeBase(recipe: RecipeDetail, familyId: string, isPrivate: boolean): EditorBase {
  return {
    familyId,
    fields: {
      title: recipe.title,
      servings: numberText(recipe.servings),
      prepMinutes: numberText(recipe.prepMinutes),
      cookMinutes: numberText(recipe.cookMinutes),
      notes: recipe.notes ?? "",
      photoUri: null,
      imageKey: recipe.imageKey ?? null,
      ingredients: recipe.ingredients.map((ingredient) => ({
        id: ingredient.id,
        amount: ingredient.quantity === undefined ? "" : amountText(ingredient.quantity),
        unit: ingredient.unit ?? null,
        name: ingredient.name,
      })),
      steps: recipe.steps.map((step) => ({ id: step.id, text: step.text })),
      folderNames: recipe.folders.map((folder) => folder.name),
      tagNames: recipe.tags.map((tag) => tag.name),
      isPrivate,
    },
    ingredients: recipe.ingredients.map((ingredient) => ({
      id: ingredient.id,
      quantity: ingredient.quantity ?? null,
      unit: ingredient.unit ?? null,
      name: ingredient.name,
    })),
  };
}

export function isSameIngredient(first: IngredientFields, second: IngredientFields) {
  return first.amount === second.amount && first.unit === second.unit && first.name === second.name;
}

function filled(fields: RecipeFields) {
  return {
    ...fields,
    title: fields.title.trim(),
    notes: fields.notes.trim(),
    ingredients: fields.ingredients.filter(
      (ingredient) => ingredient.amount || ingredient.unit || ingredient.name.trim(),
    ),
    steps: fields.steps.filter((step) => step.text.trim()),
  };
}

export function isChanged(base: RecipeFields, fields: RecipeFields) {
  return JSON.stringify(filled(base)) !== JSON.stringify(filled(fields));
}
