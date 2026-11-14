import { useQuery } from "@tanstack/react-query";
import { Match, Schema } from "effect";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { familiesQuery } from "#/entities/family";
import {
  type LibraryRecipe,
  type RecipeFilters,
  type RecipeScopeParams,
  RecipeCover,
  filterRecipes,
  libraryFolders,
  libraryTags,
  noFilters,
  recipeFacts,
  scopeFromParams,
  scopedRecipes,
  sortRecipes,
  useFamilyTables,
} from "#/entities/recipe";
import { useOrganizeRecipes } from "../model/use-organize-recipes";
import { useThemeColors } from "#/shared/lib";
import { usePreference } from "#/shared/preferences";
import { CollectionList, EmptyState, InlineError, useListLayout } from "#/shared/ui";

import { collectionMenu } from "./collection-menu";
import { selectionMenu } from "./selection-menu";

function recipeKey(recipe: LibraryRecipe) {
  return `${recipe.familyId}:${recipe.id}`;
}

export function CollectionScreen() {
  const scope = scopeFromParams(useLocalSearchParams<RecipeScopeParams>());
  const { accent } = useThemeColors("accent");
  const { data: families = [], isPending } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));
  const organize = useOrganizeRecipes();
  const [layout, setLayout] = useListLayout();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<RecipeFilters>(noFilters);
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string> | null>(null);

  const [sortField, setSortField] = usePreference(
    "recipeSortField",
    Schema.Literals(["updated", "created", "title"]),
    "updated",
  );

  const [sortDirection, setSortDirection] = usePreference(
    "recipeSortDirection",
    Schema.Literals(["ascending", "descending"]),
    "descending",
  );

  const taggedKeys =
    filters.tag === null
      ? null
      : new Set(scopedRecipes(familyTables, { kind: "tag", name: filters.tag }, "").map(recipeKey));

  const recipes = sortRecipes(
    filterRecipes(scopedRecipes(familyTables, scope, search), filters).filter(
      (recipe) => taggedKeys === null || taggedKeys.has(recipeKey(recipe)),
    ),
    sortField,
    sortDirection,
  );

  const selectedRecipes = recipes.filter((recipe) => selectedKeys?.has(recipeKey(recipe)));
  const tagNames = libraryTags(familyTables).map((tag) => tag.name);
  const isFiltered = filters !== noFilters || search.trim() !== "";

  function toggle(key: string) {
    const next = new Set(selectedKeys);

    if (next.has(key)) next.delete(key);
    else next.add(key);

    setSelectedKeys(next);
  }

  const title = Match.value(scope).pipe(
    Match.discriminatorsExhaustive("kind")({
      all: () => "All recipes",
      folder: ({ name }) => name,
      tag: ({ name }) => name,
      unsorted: () => "Unsorted",
    }),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: selectedKeys
            ? selectedRecipes.length === 0
              ? "Select recipes"
              : `${selectedRecipes.length} selected`
            : title,
          headerBackVisible: !selectedKeys,
          headerSearchBarOptions: {
            placeholder: "Search recipes",
            tintColor: accent,
            hideWhenScrolling: false,
            onChangeText: (event) => setSearch(event.nativeEvent.text),
          },
        }}
      />
      {selectedKeys ? (
        <>
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button
              onPress={() =>
                setSelectedKeys(
                  selectedRecipes.length === recipes.length
                    ? new Set()
                    : new Set(recipes.map(recipeKey)),
                )
              }
            >
              {selectedRecipes.length === recipes.length ? "Deselect all" : "Select all"}
            </Stack.Toolbar.Button>
          </Stack.Toolbar>
          <Stack.Toolbar placement="right">
            {organize.move.isPending ? (
              <Stack.Toolbar.View>
                <ActivityIndicator />
              </Stack.Toolbar.View>
            ) : (
              selectionMenu({
                recipes: selectedRecipes,
                scope,
                folderNames: libraryFolders(familyTables).map((folder) => folder.name),
                tagNames,
                organize,
                onDone: () => setSelectedKeys(null),
              })
            )}
            <Stack.Toolbar.Button
              variant="done"
              tintColor={accent}
              onPress={() => setSelectedKeys(null)}
            >
              Done
            </Stack.Toolbar.Button>
          </Stack.Toolbar>
        </>
      ) : (
        <Stack.Toolbar placement="right">
          {collectionMenu({
            filters,
            onFiltersChange: setFilters,
            tagNames: scope.kind === "tag" ? [] : tagNames,
            sortField,
            sortDirection,
            onSortChange: (field, direction) => {
              setSortField(field);
              setSortDirection(direction);
            },
            layout,
            onLayoutChange: setLayout,
            canSelect: recipes.length > 0,
            onSelect: () => setSelectedKeys(new Set()),
            filteredTint: accent,
          })}
        </Stack.Toolbar>
      )}
      {organize.move.isError && (
        <View className="items-start px-4 pt-2">
          <InlineError>
            Couldn't move those recipes. Check your connection and try again
          </InlineError>
        </View>
      )}
      <CollectionList
        items={recipes.map((recipe) => ({
          key: recipeKey(recipe),
          title: recipe.title,
          photo: recipe.imageKey ? (
            <RecipeCover recipe={{ familyId: recipe.familyId, imageKey: recipe.imageKey }} />
          ) : undefined,
          facts: recipeFacts(recipe),
          isSelected: selectedKeys ? selectedKeys.has(recipeKey(recipe)) : undefined,
          onPress: selectedKeys ? () => toggle(recipeKey(recipe)) : undefined,
          onLongPress: () => {
            void Haptics.selectionAsync();
            setSelectedKeys(new Set([...(selectedKeys ?? []), recipeKey(recipe)]));
          },
        }))}
        emptyState={
          isPending ? (
            <ActivityIndicator className="flex-1" />
          ) : isFiltered ? (
            <EmptyState
              icon="line.3.horizontal.decrease.circle"
              title="No matching recipes"
              description="Try another search, or clear the filters."
            />
          ) : scope.kind === "unsorted" ? (
            <EmptyState
              icon="checkmark.circle"
              title="Everything is in a folder"
              description="Recipes that aren't in any folder show up here."
            />
          ) : (
            <EmptyState
              icon="book"
              title="No recipes yet"
              description="Recipes added here show up in this list."
            />
          )
        }
      />
    </>
  );
}
