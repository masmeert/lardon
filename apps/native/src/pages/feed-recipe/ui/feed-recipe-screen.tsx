import type { FeedRecipe } from "@lardon/api";
import { Stack, router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { AuthorLine } from "#/entities/profile";
import {
  FeedCover,
  IngredientControls,
  IngredientRow,
  RecipeHero,
  RecipeSection,
  ScalePanel,
  StepRow,
  useRecipeScale,
} from "#/entities/recipe";
import { saveToolbarItem, useSaveRecipe } from "#/features/save-recipe";
import { timeAgo } from "#/shared/lib";
import { InlineError, KeyboardDoneButton } from "#/shared/ui";

export function FeedRecipeScreen({ published }: { published: FeedRecipe }) {
  const { recipe, recipeId, imageKey, author } = published;
  const saving = useSaveRecipe(published);
  const scaling = useRecipeScale();

  return (
    <>
      <Stack.Screen options={{ title: recipe.title }} />
      <Stack.Toolbar placement="right">{saveToolbarItem(saving)}</Stack.Toolbar>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        contentContainerClassName="pb-16"
      >
        <View className="gap-4 px-4 pt-2">
          <AuthorLine
            author={author}
            detail={timeAgo(published.publishedAt, Date.now())}
            onPress={() =>
              router.push({ pathname: "/u/[username]", params: { username: author.username } })
            }
          />
          <RecipeHero
            recipe={recipe}
            photo={imageKey && <FeedCover recipeId={recipeId} imageKey={imageKey} />}
            scale={scaling.factor}
          />
          {saving.errorMessage && (
            <View className="items-center">
              <InlineError>{saving.errorMessage}</InlineError>
            </View>
          )}
        </View>
        {recipe.ingredients.length > 0 && (
          <RecipeSection
            title="Ingredients"
            action={
              <IngredientControls
                isScalable={recipe.ingredients.some(
                  (ingredient) => ingredient.quantity !== undefined,
                )}
                {...scaling.controls}
              />
            }
          >
            {scaling.isOpen && (
              <ScalePanel
                {...scaling.panel(
                  recipe.servings,
                  recipe.ingredients.find((_, index) => String(index) === scaling.pickedKey),
                )}
              />
            )}
            <View style={{ borderCurve: "continuous" }} className="rounded-card bg-paper px-4 py-1">
              {recipe.ingredients.map((ingredient, index) => (
                <IngredientRow
                  key={`${index}-${ingredient.name}`}
                  ingredient={ingredient}
                  scale={scaling.factor}
                  unitSystem={scaling.unitSystem}
                  isFirst={index === 0}
                  {...scaling.pick(String(index))}
                />
              ))}
            </View>
          </RecipeSection>
        )}
        {recipe.steps.length > 0 && (
          <RecipeSection title="Steps">
            <View className="gap-2">
              {recipe.steps.map((step, index) => (
                <StepRow
                  key={`${index}-${step}`}
                  number={index + 1}
                  text={step}
                  ingredientNames={recipe.ingredients.map((ingredient) => ingredient.name)}
                />
              ))}
            </View>
          </RecipeSection>
        )}
        {recipe.notes && (
          <RecipeSection title="Notes">
            <View style={{ borderCurve: "continuous" }} className="rounded-card bg-paper px-4 py-3">
              <Text className="text-body text-foreground">{recipe.notes}</Text>
            </View>
          </RecipeSection>
        )}
      </ScrollView>
      <KeyboardDoneButton />
    </>
  );
}
