import {
  type Collection,
  type RecipeDraft,
  createCollection,
  ingredientFromParts,
  readRows,
} from "@lardon/recipes";
import type { MergeableStore } from "tinybase";

import { type EditorBase, type RecipeFields, isSameIngredient } from "./recipe-fields";

function numberFrom(text: string) {
  const value = Number(text.replace(",", "."));

  return text.trim() && value > 0 ? value : null;
}

function draftFrom(
  fields: RecipeFields,
  base: EditorBase,
  ownerIds: (collection: Collection, names: readonly string[]) => string[],
): RecipeDraft {
  return {
    title: fields.title,
    servings: numberFrom(fields.servings),
    prepMinutes: numberFrom(fields.prepMinutes),
    cookMinutes: numberFrom(fields.cookMinutes),
    notes: fields.notes,
    imageKey: fields.imageKey,
    ingredients: fields.ingredients.flatMap((line) => {
      const original = base.ingredients.find((ingredient) => ingredient.id === line.id);
      const originalLine = base.fields.ingredients.find((ingredient) => ingredient.id === line.id);

      if (original && originalLine && isSameIngredient(originalLine, line)) return [original];
      const ingredient = ingredientFromParts(line);

      return ingredient
        ? [{ ...ingredient, id: line.id, quantity: ingredient.quantity || null }]
        : [];
    }),
    steps: fields.steps,
    tagIds: ownerIds("tags", fields.tagNames),
    folderIds: ownerIds("folders", fields.folderNames),
  };
}

export function baseDraft(base: EditorBase, store: MergeableStore) {
  const content = store.getTables();

  return draftFrom(base.fields, base, (collection, names) =>
    readRows(content, collection).flatMap((owner) =>
      names.some((name) => name.toLocaleLowerCase() === owner.name.toLocaleLowerCase())
        ? [owner.id]
        : [],
    ),
  );
}

export function revisionDraft(
  fields: RecipeFields,
  base: EditorBase,
  store: MergeableStore,
  imageKey: string | null,
) {
  return draftFrom({ ...fields, imageKey }, base, (collection, names) =>
    names.map((name) => createCollection(store, collection, name)),
  );
}
