import { useQuery } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { FamilyFaces, familiesQuery } from "#/entities/family";
import {
  RecipeFan,
  type RecipeScope,
  libraryFolders,
  libraryTags,
  scopeParams,
  scopedRecipes,
  useFamilyTables,
} from "#/entities/recipe";
import { Button, ButtonLabel, CollectionTile, FilterPill } from "#/shared/ui";

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
            icon="folder.badge.plus"
            onPress={() => router.push("/folder/new")}
          >
            New folder
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction icon="tag" onPress={() => router.push("/tag/new")}>
            New tag
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
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
              <RecipeStickers recipes={recipes.filter((recipe) => recipe.imageKey).slice(0, 12)} />
            </>
          ) : (
            <Text className="max-w-xs text-center text-body text-muted">
              Recipes you and your family add show up here.
            </Text>
          )}
        </View>
        {families.length > 1 && (
          <CollectionSection
            title="Families"
            subtitle={count(families.length, "family", "families")}
            onShowAll={() => router.push("/families")}
          >
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
                    cover={<FamilyFaces familyId={family.id} sizePt={96} />}
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
          onShowAll={folders.length > 0 ? () => router.push("/folders") : undefined}
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
                  cover={<RecipeFan recipes={folder.recipes} icon="folder" sizePt={96} />}
                  onPress={() =>
                    openCollection({
                      kind: "folder",
                      familyId: folder.familyId,
                      folderId: folder.id,
                    })
                  }
                />
              ))}
              <CollectionTile
                name="Unsorted"
                recipeCount={unsorted.length}
                cover={<RecipeFan recipes={unsorted} icon="tray" sizePt={96} />}
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
    </>
  );
}
