import { Events, Schema } from "@livestore/livestore";

function text(maxLength: number) {
  return Schema.String.check(
    Schema.isTrimmed(),
    Schema.isMinLength(1),
    Schema.isMaxLength(maxLength),
  );
}

const Id = Schema.String.check(Schema.isPattern(/^[A-Za-z0-9_-]{1,64}$/));
const Position = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(200));
const Title = text(200);
const SectionTitle = Schema.NullOr(text(120));
const Quantity = Schema.NullOr(
  Schema.Finite.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(1_000_000)),
);
const Unit = Schema.NullOr(text(40));
const IngredientName = text(200);
const IngredientNote = Schema.NullOr(text(300));
const StepText = text(5000);
const Minutes = Schema.NullOr(
  Schema.Int.check(Schema.isGreaterThanOrEqualTo(0), Schema.isLessThanOrEqualTo(100_000)),
);
const Servings = Schema.NullOr(
  Schema.Finite.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(10_000)),
);
const ServingsUnit = Schema.NullOr(text(40));
const Notes = Schema.NullOr(text(20_000));
const SourceUrl = Schema.NullOr(
  Schema.String.check(Schema.isPattern(/^https?:\/\/\S+$/), Schema.isMaxLength(2000)),
);
const ImageKey = Schema.NullOr(Schema.String.check(Schema.isMaxLength(200)));
const Tag = text(40);
const Nutrient = Schema.NullOr(
  Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0), Schema.isLessThanOrEqualTo(100_000)),
);

export const Nutrition = Schema.Struct({
  calories: Nutrient,
  protein: Nutrient,
  carbohydrates: Nutrient,
  sugar: Nutrient,
  fat: Nutrient,
  saturatedFat: Nutrient,
  fiber: Nutrient,
  sodium: Nutrient,
});

export type Nutrition = typeof Nutrition.Type;

export const SectionKind = Schema.Literals(["ingredients", "steps"]);

export type SectionKind = typeof SectionKind.Type;

const IngredientFields = {
  quantity: Quantity,
  unit: Unit,
  name: IngredientName,
  note: IngredientNote,
};

export const recipeEvents = {
  recipeCreated: Events.synced({
    name: "v1.RecipeCreated",
    schema: Schema.Struct({
      recipeId: Id,
      title: Title,
      servings: Servings,
      servingsUnit: ServingsUnit,
      prepTimeMinutes: Minutes,
      cookTimeMinutes: Minutes,
      notes: Notes,
      sourceUrl: SourceUrl,
      imageKey: ImageKey,
      nutrition: Schema.NullOr(Nutrition),
      tags: Schema.Array(Tag).check(Schema.isMaxLength(30)),
      ingredientSections: Schema.Array(
        Schema.Struct({
          sectionId: Id,
          position: Position,
          title: SectionTitle,
          ingredients: Schema.Array(
            Schema.Struct({ ingredientId: Id, position: Position, ...IngredientFields }),
          ).check(Schema.isMaxLength(200)),
        }),
      ).check(Schema.isMaxLength(50)),
      stepSections: Schema.Array(
        Schema.Struct({
          sectionId: Id,
          position: Position,
          title: SectionTitle,
          steps: Schema.Array(
            Schema.Struct({ stepId: Id, position: Position, text: StepText }),
          ).check(Schema.isMaxLength(200)),
        }),
      ).check(Schema.isMaxLength(50)),
      createdById: Id,
      createdAt: Schema.DateFromString,
    }),
  }),

  recipeDetailsUpdated: Events.synced({
    name: "v1.RecipeDetailsUpdated",
    schema: Schema.Struct({
      recipeId: Id,
      updatedAt: Schema.DateFromString,
      title: Schema.optionalKey(Title),
      servings: Schema.optionalKey(Servings),
      servingsUnit: Schema.optionalKey(ServingsUnit),
      prepTimeMinutes: Schema.optionalKey(Minutes),
      cookTimeMinutes: Schema.optionalKey(Minutes),
      notes: Schema.optionalKey(Notes),
      sourceUrl: Schema.optionalKey(SourceUrl),
    }),
  }),

  recipeNutritionSet: Events.synced({
    name: "v1.RecipeNutritionSet",
    schema: Schema.Struct({
      recipeId: Id,
      nutrition: Schema.NullOr(Nutrition),
      updatedAt: Schema.DateFromString,
    }),
  }),

  recipeTagAdded: Events.synced({
    name: "v1.RecipeTagAdded",
    schema: Schema.Struct({ recipeId: Id, tag: Tag, updatedAt: Schema.DateFromString }),
  }),

  recipeTagRemoved: Events.synced({
    name: "v1.RecipeTagRemoved",
    schema: Schema.Struct({ recipeId: Id, tag: Tag, updatedAt: Schema.DateFromString }),
  }),

  recipeImageSet: Events.synced({
    name: "v1.RecipeImageSet",
    schema: Schema.Struct({ recipeId: Id, imageKey: ImageKey, updatedAt: Schema.DateFromString }),
  }),

  recipeDeleted: Events.synced({
    name: "v1.RecipeDeleted",
    schema: Schema.Struct({ recipeId: Id, deletedAt: Schema.DateFromString }),
  }),

  recipeRestored: Events.synced({
    name: "v1.RecipeRestored",
    schema: Schema.Struct({ recipeId: Id, updatedAt: Schema.DateFromString }),
  }),

  recipeSectionAdded: Events.synced({
    name: "v1.RecipeSectionAdded",
    schema: Schema.Struct({
      recipeId: Id,
      sectionId: Id,
      kind: SectionKind,
      title: SectionTitle,
      position: Position,
      updatedAt: Schema.DateFromString,
    }),
  }),

  recipeSectionRenamed: Events.synced({
    name: "v1.RecipeSectionRenamed",
    schema: Schema.Struct({
      recipeId: Id,
      sectionId: Id,
      title: SectionTitle,
      updatedAt: Schema.DateFromString,
    }),
  }),

  recipeSectionMoved: Events.synced({
    name: "v1.RecipeSectionMoved",
    schema: Schema.Struct({
      recipeId: Id,
      sectionId: Id,
      position: Position,
      updatedAt: Schema.DateFromString,
    }),
  }),

  recipeSectionRemoved: Events.synced({
    name: "v1.RecipeSectionRemoved",
    schema: Schema.Struct({ recipeId: Id, sectionId: Id, deletedAt: Schema.DateFromString }),
  }),

  ingredientAdded: Events.synced({
    name: "v1.IngredientAdded",
    schema: Schema.Struct({
      recipeId: Id,
      sectionId: Id,
      ingredientId: Id,
      position: Position,
      ...IngredientFields,
      updatedAt: Schema.DateFromString,
    }),
  }),

  ingredientUpdated: Events.synced({
    name: "v1.IngredientUpdated",
    schema: Schema.Struct({
      recipeId: Id,
      ingredientId: Id,
      updatedAt: Schema.DateFromString,
      quantity: Schema.optionalKey(Quantity),
      unit: Schema.optionalKey(Unit),
      name: Schema.optionalKey(IngredientName),
      note: Schema.optionalKey(IngredientNote),
    }),
  }),

  ingredientMoved: Events.synced({
    name: "v1.IngredientMoved",
    schema: Schema.Struct({
      recipeId: Id,
      ingredientId: Id,
      sectionId: Id,
      position: Position,
      updatedAt: Schema.DateFromString,
    }),
  }),

  ingredientRemoved: Events.synced({
    name: "v1.IngredientRemoved",
    schema: Schema.Struct({ recipeId: Id, ingredientId: Id, deletedAt: Schema.DateFromString }),
  }),

  stepAdded: Events.synced({
    name: "v1.StepAdded",
    schema: Schema.Struct({
      recipeId: Id,
      sectionId: Id,
      stepId: Id,
      position: Position,
      text: StepText,
      updatedAt: Schema.DateFromString,
    }),
  }),

  stepEdited: Events.synced({
    name: "v1.StepEdited",
    schema: Schema.Struct({
      recipeId: Id,
      stepId: Id,
      text: StepText,
      updatedAt: Schema.DateFromString,
    }),
  }),

  stepMoved: Events.synced({
    name: "v1.StepMoved",
    schema: Schema.Struct({
      recipeId: Id,
      stepId: Id,
      sectionId: Id,
      position: Position,
      updatedAt: Schema.DateFromString,
    }),
  }),

  stepRemoved: Events.synced({
    name: "v1.StepRemoved",
    schema: Schema.Struct({ recipeId: Id, stepId: Id, deletedAt: Schema.DateFromString }),
  }),
};
