import { type MaterializerContextQuery, Schema, State, makeSchema } from "@livestore/livestore";

import { Nutrition, SectionKind, recipeEvents } from "./events";

const deletedAt = State.SQLite.integer({ nullable: true, schema: Schema.DateFromMillis });

export const recipeTables = {
  recipes: State.SQLite.table({
    name: "recipes",
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      title: State.SQLite.text(),
      servings: State.SQLite.real({ nullable: true }),
      servingsUnit: State.SQLite.text({ nullable: true }),
      prepTimeMinutes: State.SQLite.integer({ nullable: true }),
      cookTimeMinutes: State.SQLite.integer({ nullable: true }),
      notes: State.SQLite.text({ nullable: true }),
      sourceUrl: State.SQLite.text({ nullable: true }),
      imageKey: State.SQLite.text({ nullable: true }),
      nutrition: State.SQLite.json({ schema: Nutrition, nullable: true }),
      tags: State.SQLite.json({ schema: Schema.Array(Schema.String), default: [] }),
      createdById: State.SQLite.text(),
      createdAt: State.SQLite.integer({ schema: Schema.DateFromMillis }),
      updatedAt: State.SQLite.integer({ schema: Schema.DateFromMillis }),
    },
    indexes: [{ name: "recipes_updatedAt", columns: ["updatedAt"] }],
  }),

  recipeSections: State.SQLite.table({
    name: "recipeSections",
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      recipeId: State.SQLite.text(),
      kind: State.SQLite.text({ schema: SectionKind }),
      title: State.SQLite.text({ nullable: true }),
      position: State.SQLite.text(),
      deletedAt,
    },
    indexes: [{ name: "recipeSections_recipeId", columns: ["recipeId"] }],
  }),

  ingredients: State.SQLite.table({
    name: "ingredients",
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      recipeId: State.SQLite.text(),
      sectionId: State.SQLite.text(),
      position: State.SQLite.text(),
      quantity: State.SQLite.real({ nullable: true }),
      unit: State.SQLite.text({ nullable: true }),
      name: State.SQLite.text(),
      note: State.SQLite.text({ nullable: true }),
      deletedAt,
    },
    indexes: [{ name: "ingredients_recipeId", columns: ["recipeId"] }],
  }),

  steps: State.SQLite.table({
    name: "steps",
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      recipeId: State.SQLite.text(),
      sectionId: State.SQLite.text(),
      position: State.SQLite.text(),
      text: State.SQLite.text(),
      deletedAt,
    },
    indexes: [{ name: "steps_recipeId", columns: ["recipeId"] }],
  }),
};

function touchRecipe(recipeId: string, updatedAt: Date) {
  return {
    sql: "UPDATE recipes SET updatedAt = MAX(updatedAt, $updatedAt) WHERE id = $recipeId",
    bindValues: { recipeId, updatedAt: updatedAt.getTime() },
  };
}

function recipeExists(context: { query: MaterializerContextQuery }, recipeId: string) {
  return context.query(recipeTables.recipes.select("id").where({ id: recipeId })).length > 0;
}

const materializers = State.SQLite.materializers(recipeEvents, {
  "v1.RecipeCreated": ({ recipeId, ingredientSections, stepSections, createdAt, ...recipe }) => [
    recipeTables.recipes
      .insert({ ...recipe, id: recipeId, createdAt, updatedAt: createdAt })
      .onConflict("id", "ignore"),
    ...ingredientSections.flatMap(({ sectionId, position, title, ingredients }) => [
      recipeTables.recipeSections
        .insert({ id: sectionId, recipeId, kind: "ingredients", title, position })
        .onConflict("id", "ignore"),
      ...ingredients.map(({ ingredientId, ...ingredient }) =>
        recipeTables.ingredients
          .insert({ ...ingredient, id: ingredientId, recipeId, sectionId })
          .onConflict("id", "ignore"),
      ),
    ]),
    ...stepSections.flatMap(({ sectionId, position, title, steps }) => [
      recipeTables.recipeSections
        .insert({ id: sectionId, recipeId, kind: "steps", title, position })
        .onConflict("id", "ignore"),
      ...steps.map(({ stepId, position: stepPosition, text }) =>
        recipeTables.steps
          .insert({ id: stepId, recipeId, sectionId, position: stepPosition, text })
          .onConflict("id", "ignore"),
      ),
    ]),
  ],

  "v1.RecipeDetailsUpdated": ({ recipeId, updatedAt, ...changes }) =>
    Object.keys(changes).length === 0
      ? touchRecipe(recipeId, updatedAt)
      : [
          recipeTables.recipes.update(changes).where({ id: recipeId }),
          touchRecipe(recipeId, updatedAt),
        ],

  "v1.RecipeNutritionSet": ({ recipeId, nutrition, updatedAt }) => [
    recipeTables.recipes.update({ nutrition }).where({ id: recipeId }),
    touchRecipe(recipeId, updatedAt),
  ],

  "v1.RecipeTagAdded": ({ recipeId, tag, updatedAt }, context) => {
    const [current] = context.query(recipeTables.recipes.select("tags").where({ id: recipeId }));

    if (!current || current.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      return [];
    }

    return [
      recipeTables.recipes.update({ tags: [...current, tag] }).where({ id: recipeId }),
      touchRecipe(recipeId, updatedAt),
    ];
  },

  "v1.RecipeTagRemoved": ({ recipeId, tag, updatedAt }, context) => {
    const [current] = context.query(recipeTables.recipes.select("tags").where({ id: recipeId }));

    if (!current) return [];

    return [
      recipeTables.recipes
        .update({
          tags: current.filter((existing) => existing.toLowerCase() !== tag.toLowerCase()),
        })
        .where({ id: recipeId }),
      touchRecipe(recipeId, updatedAt),
    ];
  },

  "v1.RecipeImageSet": ({ recipeId, imageKey, updatedAt }) => [
    recipeTables.recipes.update({ imageKey }).where({ id: recipeId }),
    touchRecipe(recipeId, updatedAt),
  ],

  "v1.RecipeDeleted": ({ recipeId }) => [
    recipeTables.steps.delete().where({ recipeId }),
    recipeTables.ingredients.delete().where({ recipeId }),
    recipeTables.recipeSections.delete().where({ recipeId }),
    recipeTables.recipes.delete().where({ id: recipeId }),
  ],

  "v1.RecipeErased": () => [],

  "v1.RecipeSectionAdded": ({ recipeId, sectionId, kind, title, position, updatedAt }, context) =>
    recipeExists(context, recipeId)
      ? [
          recipeTables.recipeSections
            .insert({ id: sectionId, recipeId, kind, title, position })
            .onConflict("id", "ignore"),
          touchRecipe(recipeId, updatedAt),
        ]
      : [],

  "v1.RecipeSectionRenamed": ({ recipeId, sectionId, title, updatedAt }) => [
    recipeTables.recipeSections.update({ title }).where({ id: sectionId }),
    touchRecipe(recipeId, updatedAt),
  ],

  "v1.RecipeSectionMoved": ({ recipeId, sectionId, position, updatedAt }) => [
    recipeTables.recipeSections.update({ position }).where({ id: sectionId }),
    touchRecipe(recipeId, updatedAt),
  ],

  "v1.RecipeSectionRemoved": ({ recipeId, sectionId, deletedAt }) => [
    recipeTables.recipeSections.update({ deletedAt }).where({ id: sectionId }),
    touchRecipe(recipeId, deletedAt),
  ],

  "v1.IngredientAdded": ({ recipeId, ingredientId, updatedAt, ...ingredient }, context) =>
    recipeExists(context, recipeId)
      ? [
          recipeTables.ingredients
            .insert({ ...ingredient, id: ingredientId, recipeId })
            .onConflict("id", "ignore"),
          touchRecipe(recipeId, updatedAt),
        ]
      : [],

  "v1.IngredientUpdated": ({ recipeId, ingredientId, updatedAt, ...changes }) =>
    Object.keys(changes).length === 0
      ? touchRecipe(recipeId, updatedAt)
      : [
          recipeTables.ingredients.update(changes).where({ id: ingredientId }),
          touchRecipe(recipeId, updatedAt),
        ],

  "v1.IngredientMoved": ({ recipeId, ingredientId, sectionId, position, updatedAt }) => [
    recipeTables.ingredients.update({ sectionId, position }).where({ id: ingredientId }),
    touchRecipe(recipeId, updatedAt),
  ],

  "v1.IngredientRemoved": ({ recipeId, ingredientId, deletedAt }) => [
    recipeTables.ingredients.update({ deletedAt }).where({ id: ingredientId }),
    touchRecipe(recipeId, deletedAt),
  ],

  "v1.StepAdded": ({ recipeId, sectionId, stepId, position, text, updatedAt }, context) =>
    recipeExists(context, recipeId)
      ? [
          recipeTables.steps
            .insert({ id: stepId, recipeId, sectionId, position, text })
            .onConflict("id", "ignore"),
          touchRecipe(recipeId, updatedAt),
        ]
      : [],

  "v1.StepEdited": ({ recipeId, stepId, text, updatedAt }) => [
    recipeTables.steps.update({ text }).where({ id: stepId }),
    touchRecipe(recipeId, updatedAt),
  ],

  "v1.StepMoved": ({ recipeId, stepId, sectionId, position, updatedAt }) => [
    recipeTables.steps.update({ sectionId, position }).where({ id: stepId }),
    touchRecipe(recipeId, updatedAt),
  ],

  "v1.StepRemoved": ({ recipeId, stepId, deletedAt }) => [
    recipeTables.steps.update({ deletedAt }).where({ id: stepId }),
    touchRecipe(recipeId, deletedAt),
  ],
});

export const recipeSchema = makeSchema({
  events: recipeEvents,
  state: State.SQLite.makeState({ tables: recipeTables, materializers }),
  devtools: { alias: "recipes" },
});

export type RecipeSchema = typeof recipeSchema;
