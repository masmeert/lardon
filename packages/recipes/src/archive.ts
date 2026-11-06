import { Schema, type Store } from "@livestore/livestore";

import { createRecipe } from "./commands";
import {
  IngredientFields,
  Nutrition,
  RecipeDetailsFields,
  SectionFields,
  StepFields,
  TagList,
} from "./events";
import { readRecipeDocument, recipes$ } from "./queries";
import type { RecipeSchema } from "./schema";

export const ArchivedPicture = Schema.Struct({
  contentType: Schema.Literals(["image/jpeg", "image/png", "image/webp"]),
  data: Schema.Uint8ArrayFromBase64,
});
export type ArchivedPicture = typeof ArchivedPicture.Type;

export const ArchivedRecipe = Schema.Struct({
  ...RecipeDetailsFields,
  nutrition: Schema.NullOr(Nutrition),
  tags: TagList,
  ingredients: Schema.Array(
    Schema.Struct({
      ...SectionFields,
      ingredients: Schema.Array(Schema.Struct(IngredientFields)).check(Schema.isMaxLength(200)),
    }),
  ).check(Schema.isMaxLength(50)),
  steps: Schema.Array(
    Schema.Struct({
      ...SectionFields,
      steps: Schema.Array(Schema.Struct(StepFields)).check(Schema.isMaxLength(200)),
    }),
  ).check(Schema.isMaxLength(50)),
  picture: Schema.NullOr(ArchivedPicture),
});

export const RecipeArchive = Schema.Struct({
  format: Schema.Literal("lardon.recipes"),
  version: Schema.Literal(1),
  exportedAt: Schema.DateFromString,
  recipes: Schema.Array(ArchivedRecipe),
});
export type RecipeArchive = typeof RecipeArchive.Type;

const RecipeArchiveJson = Schema.fromJsonString(RecipeArchive);

export function createRecipeArchive(
  store: Store<RecipeSchema>,
  pictures: ReadonlyMap<string, ArchivedPicture> = new Map(),
): RecipeArchive {
  return {
    format: "lardon.recipes",
    version: 1,
    exportedAt: new Date(),
    recipes: store.query(recipes$).flatMap((recipe) => {
      const document = readRecipeDocument(store, recipe.id);
      if (!document) return [];
      const { imageKey, ...content } = document;
      return [{ ...content, picture: imageKey ? (pictures.get(imageKey) ?? null) : null }];
    }),
  };
}

export function encodeRecipeArchive(archive: RecipeArchive) {
  return Schema.encodeSync(RecipeArchiveJson)(archive);
}

export function decodeRecipeArchive(json: string) {
  return Schema.decodeUnknownResult(RecipeArchiveJson)(json);
}

export function importRecipeArchive(
  store: Store<RecipeSchema>,
  archive: RecipeArchive,
  createdById: string,
  imageKeys: ReadonlyArray<string | null> = [],
) {
  return archive.recipes.map(({ picture: _picture, ...recipe }, index) =>
    createRecipe(store, { ...recipe, imageKey: imageKeys[index] ?? null, createdById }),
  );
}
