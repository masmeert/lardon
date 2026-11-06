import { z } from "zod";

function trimmed(maxLength: number) {
  return z.string().trim().max(maxLength);
}

function optionalText(maxLength: number) {
  return trimmed(maxLength)
    .nullish()
    .transform((value) => value || null);
}

function orNull<Schema extends z.ZodType>(schema: Schema) {
  return schema.nullish().transform((value) => value ?? null);
}

function orEmpty<Schema extends z.ZodType<unknown[]>>(schema: Schema) {
  return schema.nullish().transform((value) => value ?? ([] as z.output<Schema>));
}

export const ingredientSchema = z.object({
  quantity: orNull(z.number().positive().max(1_000_000)),
  unit: optionalText(40),
  name: trimmed(200).min(1),
  note: optionalText(300),
});

export const ingredientSectionSchema = z.object({
  title: optionalText(120),
  ingredients: z.array(ingredientSchema).max(200),
});

export const stepSchema = z.object({
  text: trimmed(5000).min(1),
});

export const stepSectionSchema = z.object({
  title: optionalText(120),
  steps: z.array(stepSchema).max(200),
});

const nutrient = orNull(z.number().nonnegative().max(100_000));

export const nutritionSchema = z.object({
  calories: nutrient,
  protein: nutrient,
  carbohydrates: nutrient,
  sugar: nutrient,
  fat: nutrient,
  saturatedFat: nutrient,
  fiber: nutrient,
  sodium: nutrient,
});

export const tagsSchema = z
  .array(trimmed(40).min(1))
  .max(30)
  .transform((tags) => {
    const seen = new Set<string>();
    return tags.filter((tag) => {
      if (seen.has(tag.toLowerCase())) return false;
      seen.add(tag.toLowerCase());
      return true;
    });
  });

export const recipeContentSchema = z.object({
  title: trimmed(200).min(1),
  servings: orNull(z.number().positive().max(10_000)),
  servingsUnit: optionalText(40),
  prepTimeMinutes: orNull(z.number().int().nonnegative().max(100_000)),
  cookTimeMinutes: orNull(z.number().int().nonnegative().max(100_000)),
  ingredients: orEmpty(z.array(ingredientSectionSchema).max(50)),
  steps: orEmpty(z.array(stepSectionSchema).max(50)),
  nutrition: orNull(nutritionSchema),
  tags: orEmpty(tagsSchema),
  notes: optionalText(20_000),
  sourceUrl: orNull(z.url({ protocol: /^https?$/ }).max(2000)),
});

export const recipePatchSchema = recipeContentSchema.partial();

export type Ingredient = z.output<typeof ingredientSchema>;
export type IngredientSection = z.output<typeof ingredientSectionSchema>;
export type Step = z.output<typeof stepSchema>;
export type StepSection = z.output<typeof stepSectionSchema>;
export type Nutrition = z.output<typeof nutritionSchema>;
export type RecipeContent = z.output<typeof recipeContentSchema>;
export type RecipeContentInput = z.input<typeof recipeContentSchema>;
export type RecipePatch = z.output<typeof recipePatchSchema>;
