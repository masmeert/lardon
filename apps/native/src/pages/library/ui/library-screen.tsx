import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { familiesQuery } from "#/entities/family";
import {
  type RecipeScope,
  libraryFolders,
  libraryTags,
  scopeParams,
  scopedRecipes,
  useFamilyTables,
} from "#/entities/recipe";
import { Button, ButtonLabel, FilterPill } from "#/shared/ui";

import { CollectionSection } from "./collection-section";
import { CollectionTile } from "./collection-tile";
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
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="pb-16">
      <View className="items-center gap-5 px-5 pt-2 pb-8">
        <View className="items-center">
          <Text className="text-display font-bold text-foreground">{recipes.length}</Text>
          <Text className="text-caption font-semibold text-muted">
            {recipes.length === 1 ? "Saved recipe" : "Saved recipes"}
          </Text>
        </View>
        {recipes.length > 0 ? (
          <>
            <Button onPress={() => openCollection({ kind: "all" })}>
              <ButtonLabel>All recipes</ButtonLabel>
            </Button>
            <RecipeStickers recipeIds={recipes.slice(0, 9).map((recipe) => recipe.id)} />
          </>
        ) : (
          <Text className="max-w-xs text-center text-body text-muted">
            Recipes you and your family add show up here.
          </Text>
        )}
      </View>
      {families.length > 1 && (
        <CollectionSection title="Families" subtitle={count(families.length, "family", "families")}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3 px-5"
          >
            {families.map((family) => {
              const familyRecipes = scopedRecipes(
                familyTables,
                { kind: "family", familyId: family.id },
                "",
              );

              return (
                <CollectionTile
                  key={family.id}
                  name={family.name}
                  recipeCount={familyRecipes.length}
                  hasPreview={familyRecipes.length > 0}
                  icon="person.2"
                  onPress={() => openCollection({ kind: "family", familyId: family.id })}
                />
              );
            })}
          </ScrollView>
        </CollectionSection>
      )}
      <CollectionSection
        title="Folders"
        subtitle={
          folders.length > 0 ? count(folders.length, "folder", "folders") : "No folders yet"
        }
      >
        {folders.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3 px-5"
          >
            {folders.map((folder) => (
              <CollectionTile
                key={`${folder.familyId}:${folder.id}`}
                name={folder.name}
                recipeCount={folder.recipeCount}
                hasPreview={folder.preview !== undefined}
                icon="folder"
                onPress={() =>
                  openCollection({ kind: "folder", familyId: folder.familyId, folderId: folder.id })
                }
              />
            ))}
            <CollectionTile
              name="Unsorted"
              recipeCount={unsorted.length}
              hasPreview={unsorted.length > 0}
              icon="tray"
              onPress={() => openCollection({ kind: "unsorted" })}
            />
          </ScrollView>
        ) : (
          <Text className="px-5 text-body text-muted">
            Group recipes into folders, like Sunday dinners or Grandma's classics.
          </Text>
        )}
      </CollectionSection>
      <CollectionSection
        title="Tags"
        subtitle={tags.length > 0 ? count(tags.length, "tag", "tags") : "No tags yet"}
      >
        {tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-2.5 px-5">
            {tags.map((tag) => (
              <FilterPill
                key={tag.name}
                label={tag.name}
                onPress={() => openCollection({ kind: "tag", name: tag.name })}
              />
            ))}
          </View>
        ) : (
          <Text className="px-5 text-body text-muted">
            Tag recipes to find them by dish, diet or season.
          </Text>
        )}
      </CollectionSection>
    </ScrollView>
  );
}
