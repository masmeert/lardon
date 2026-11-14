import { recipeDetail } from "@lardon/recipes";
import { onlineManager, useQuery } from "@tanstack/react-query";
import { Schema } from "effect";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState, useSyncExternalStore } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { familiesQuery } from "#/entities/family";
import { libraryFolders, libraryTags, scopeParams, useFamilyTables } from "#/entities/recipe";
import { useOrganizeRecipes } from "#/features/organize-recipes";
import { useThemeColors } from "#/shared/lib";
import { usePreference } from "#/shared/preferences";
import { EmptyState, FilterPill, InlineError } from "#/shared/ui";

import { useShareRecipe } from "../model/use-share-recipe";

import { IngredientControls } from "./ingredient-controls";
import { IngredientRow } from "./ingredient-row";
import { KeyboardDoneButton } from "./keyboard-done-button";
import { RecipeHero } from "./recipe-hero";
import { recipeMenu } from "./recipe-menu";
import { RecipeSection } from "./recipe-section";
import { type ScaleMode, ScalePanel } from "./scale-panel";
import { StepRow } from "./step-row";

export function RecipeScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const { background, foreground } = useThemeColors("background", "foreground");
  const { data: families = [], isPending } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));
  const organize = useOrganizeRecipes();
  const share = useShareRecipe();

  const isOnline = useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );

  const [scaleFactor, setScaleFactor] = useState(1);
  const [isScaleOpen, setIsScaleOpen] = useState(false);
  const [scaleMode, setScaleMode] = useState<ScaleMode>("amount");
  const [scaledIngredientId, setScaledIngredientId] = useState<string | null>(null);

  const [unitSystem, setUnitSystem] = usePreference(
    "unitSystem",
    Schema.Literals(["original", "metric", "imperial"]),
    "original",
  );

  const owner = familyTables.find(({ tables }) => tables.recipes?.[recipeId] !== undefined);
  const recipe = owner && recipeDetail(owner.tables, recipeId);
  const ingredientNames = recipe?.ingredients.map((ingredient) => ingredient.name) ?? [];
  const isPicking = isScaleOpen && scaleMode === "ingredient";

  const scaledIngredient = recipe?.ingredients.find(
    (ingredient) => ingredient.id === scaledIngredientId,
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerTintColor: foreground,
          headerBackButtonDisplayMode: "minimal",
          scrollEdgeEffects: { top: "soft" },
          contentStyle: { backgroundColor: background },
          title: recipe?.title ?? "",
        }}
      />
      {owner && recipe && (
        <Stack.Toolbar placement="right">
          {share.link.isPending || share.pdf.isPending ? (
            <Stack.Toolbar.View>
              <ActivityIndicator />
            </Stack.Toolbar.View>
          ) : (
            <Stack.Toolbar.Menu
              icon={share.copy.isSuccess ? "checkmark" : "square.and.arrow.up"}
              accessibilityLabel={share.copy.isSuccess ? "Copied as Markdown" : "Share"}
            >
              <Stack.Toolbar.MenuAction
                icon="link"
                disabled={!isOnline}
                subtitle={
                  isOnline ? "Anyone with the link can see it for 7 days" : "Needs a connection"
                }
                onPress={() => share.link.mutate({ recipe, familyId: owner.familyId })}
              >
                Send a link
              </Stack.Toolbar.MenuAction>
              <Stack.Toolbar.MenuAction
                icon="doc.richtext"
                onPress={() =>
                  share.pdf.mutate({
                    recipe,
                    familyId: owner.familyId,
                    scale: scaleFactor,
                    unitSystem,
                  })
                }
              >
                Export as PDF
              </Stack.Toolbar.MenuAction>
              <Stack.Toolbar.MenuAction
                icon="doc.on.doc"
                subtitle="To paste into an assistant or a note"
                onPress={() => share.copy.mutate({ recipe, scale: scaleFactor, unitSystem })}
              >
                Copy as Markdown
              </Stack.Toolbar.MenuAction>
            </Stack.Toolbar.Menu>
          )}
          {recipeMenu({
            recipe: { ...recipe, familyId: owner.familyId },
            folderNames: libraryFolders(familyTables).map((folder) => folder.name),
            tagNames: libraryTags(familyTables).map((tag) => tag.name),
            organize,
            onDeleted: () => router.back(),
          })}
        </Stack.Toolbar>
      )}
      {!owner || !recipe ? (
        isPending ? (
          <ActivityIndicator className="flex-1" />
        ) : (
          <EmptyState
            icon="book"
            title="This recipe is gone"
            description="It was deleted, maybe on another device."
          />
        )
      ) : (
        <>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            keyboardDismissMode="on-drag"
            contentContainerClassName="pb-16"
          >
            <View className="px-4 pt-2">
              <RecipeHero recipe={recipe} familyId={owner.familyId} scale={scaleFactor} />
              {(share.link.isError || share.pdf.isError || share.copy.isError) && (
                <View className="items-center pt-3">
                  <InlineError>
                    {share.link.isError
                      ? "Couldn't create the link. Check your connection and try again."
                      : share.pdf.isError
                        ? "Couldn't make the PDF. Try again."
                        : "Couldn't copy the recipe. Try again."}
                  </InlineError>
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
                    scaleFactor={scaleFactor}
                    onScalePress={() => setIsScaleOpen(!isScaleOpen)}
                    unitSystem={unitSystem}
                    onUnitSystemChange={setUnitSystem}
                  />
                }
              >
                {isScaleOpen && (
                  <ScalePanel
                    servings={recipe.servings}
                    factor={scaleFactor}
                    onFactorChange={setScaleFactor}
                    mode={scaleMode}
                    onModeChange={setScaleMode}
                    scaledIngredient={
                      scaledIngredient?.quantity === undefined
                        ? undefined
                        : {
                            name: scaledIngredient.name,
                            quantity: scaledIngredient.quantity,
                            unit: scaledIngredient.unit,
                          }
                    }
                    onClear={() => {
                      setScaleFactor(1);
                      setScaledIngredientId(null);
                    }}
                  />
                )}
                <View
                  style={{ borderCurve: "continuous" }}
                  className="rounded-card bg-paper px-4 py-1"
                >
                  {recipe.ingredients.map((ingredient, index) => (
                    <IngredientRow
                      key={ingredient.id}
                      ingredient={ingredient}
                      scale={scaleFactor}
                      unitSystem={unitSystem}
                      isFirst={index === 0}
                      isPickable={isPicking}
                      isPicked={isPicking && scaledIngredientId === ingredient.id}
                      onPick={() => setScaledIngredientId(ingredient.id)}
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
                      key={step.id}
                      number={index + 1}
                      text={step.text}
                      ingredientNames={ingredientNames}
                    />
                  ))}
                </View>
              </RecipeSection>
            )}
            {recipe.ingredients.length === 0 && recipe.steps.length === 0 && (
              <Text className="px-4 pt-8 text-center text-body text-muted">
                No ingredients or steps yet.
              </Text>
            )}
            {recipe.notes && (
              <RecipeSection title="Notes">
                <View
                  style={{ borderCurve: "continuous" }}
                  className="rounded-card bg-paper px-4 py-3"
                >
                  <Text className="text-body text-foreground">{recipe.notes}</Text>
                </View>
              </RecipeSection>
            )}
            {recipe.tags.length > 0 && (
              <RecipeSection title="Tags">
                <View className="flex-row flex-wrap gap-2">
                  {recipe.tags.map((tag) => (
                    <FilterPill
                      key={tag.id}
                      label={tag.name}
                      onPress={() =>
                        router.push({
                          pathname: "/collection",
                          params: scopeParams({ kind: "tag", name: tag.name }),
                        })
                      }
                    />
                  ))}
                </View>
              </RecipeSection>
            )}
          </ScrollView>
          <KeyboardDoneButton />
        </>
      )}
    </>
  );
}
