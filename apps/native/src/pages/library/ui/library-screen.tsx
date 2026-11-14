import { useQuery } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { familiesQuery } from "#/entities/family";
import {
  RecipeFan,
  type RecipeScope,
  libraryFolders,
  libraryTags,
  scopeParams,
  scopedRecipes,
  useFamilyTables,
} from "#/entities/recipe";
import { Button, ButtonLabel, CollectionTile, EmptyState, FilterPill } from "#/shared/ui";

import { CollectionSection } from "./collection-section";
import { RecipeStickers } from "./recipe-stickers";

function count(amount: number, singular: string, plural: string) {
  return `${amount} ${amount === 1 ? singular : plural}`;
}

function openCollection(scope: RecipeScope) {
  router.push({ pathname: "/collection", params: scopeParams(scope) });
}

export function LibraryScreen() {
  const { data: families = [], isPending } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));
  const recipes = scopedRecipes(familyTables, { kind: "all" }, "");
  const unsorted = scopedRecipes(familyTables, { kind: "unsorted" }, "");
  const folders = libraryFolders(familyTables);
  const tags = libraryTags(familyTables);

  if (isPending) return <ActivityIndicator className="flex-1" />;

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="plus" accessibilityLabel="Add">
          <Stack.Toolbar.MenuAction
            icon="square.and.pencil"
            onPress={() => router.push("/recipe/new")}
          >
            New recipe
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.Menu inline>
            <Stack.Toolbar.MenuAction
              icon="folder.badge.plus"
              onPress={() => router.push("/folder/new")}
            >
              New folder
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.MenuAction icon="tag" onPress={() => router.push("/tag/new")}>
              New tag
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      {recipes.length === 0 && folders.length === 0 && tags.length === 0 ? (
        <EmptyState
          icon="book"
          title="No recipes yet"
          description={
            families.some((family) => !family.personal)
              ? "Recipes you and your family add show up here."
              : "Recipes you add show up here."
          }
          action={{
            label: "New recipe",
            icon: "square.and.pencil",
            onPress: () => router.push("/recipe/new"),
          }}
        />
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-16">
          {recipes.length > 0 && (
            <View className="items-center gap-5 px-5 pt-2 pb-8">
              <View className="items-center">
                <Text className="text-large-title font-semibold text-foreground">
                  {recipes.length}
                </Text>
                <Text className="text-caption font-semibold text-muted">
                  {recipes.length === 1 ? "Saved recipe" : "Saved recipes"}
                </Text>
              </View>
              <Button onPress={() => openCollection({ kind: "all" })}>
                <ButtonLabel>All recipes</ButtonLabel>
              </Button>
              <RecipeStickers recipes={recipes.filter((recipe) => recipe.imageKey).slice(0, 12)} />
            </View>
          )}
          {folders.length > 0 && (
            <CollectionSection
              title="Folders"
              subtitle={count(folders.length, "folder", "folders")}
              onShowAll={() => router.push("/folders")}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-3 px-5"
              >
                {folders.map((folder) => (
                  <CollectionTile
                    key={folder.name}
                    name={folder.name}
                    recipeCount={folder.recipes.length}
                    cover={<RecipeFan recipes={folder.recipes} icon="folder" sizePt={96} />}
                    onPress={() => openCollection({ kind: "folder", name: folder.name })}
                  />
                ))}
                <CollectionTile
                  name="Unsorted"
                  recipeCount={unsorted.length}
                  cover={<RecipeFan recipes={unsorted} icon="tray" sizePt={96} />}
                  onPress={() => openCollection({ kind: "unsorted" })}
                />
              </ScrollView>
            </CollectionSection>
          )}
          {tags.length > 0 && (
            <CollectionSection title="Tags" subtitle={count(tags.length, "tag", "tags")}>
              <View className="flex-row flex-wrap gap-2.5 px-5">
                {tags.map((tag) => (
                  <FilterPill
                    key={tag.name}
                    label={tag.name}
                    onPress={() => openCollection({ kind: "tag", name: tag.name })}
                  />
                ))}
              </View>
            </CollectionSection>
          )}
        </ScrollView>
      )}
    </>
  );
}
