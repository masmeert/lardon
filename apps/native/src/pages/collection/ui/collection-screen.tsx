import { useQuery } from "@tanstack/react-query";
import { Match } from "effect";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator } from "react-native";

import { familiesQuery } from "#/entities/family";
import {
  RecipeFacts,
  type RecipeScopeParams,
  RecipeThumbnail,
  libraryFolders,
  scopeFromParams,
  scopedRecipes,
  useFamilyTables,
} from "#/entities/recipe";
import { useThemeColors } from "#/shared/lib";
import { CollectionList, EmptyState, ListLayoutMenu } from "#/shared/ui";

export function CollectionScreen() {
  const scope = scopeFromParams(useLocalSearchParams<RecipeScopeParams>());
  const { accent } = useThemeColors("accent");
  const { data: families = [], isPending } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));
  const [search, setSearch] = useState("");
  const recipes = scopedRecipes(familyTables, scope, search);

  const title = Match.value(scope).pipe(
    Match.discriminatorsExhaustive("kind")({
      all: () => "All recipes",
      family: ({ familyId }) => families.find((family) => family.id === familyId)?.name,
      folder: ({ familyId, folderId }) =>
        libraryFolders(familyTables).find(
          (folder) => folder.familyId === familyId && folder.id === folderId,
        )?.name,
      tag: ({ name }) => name,
      unsorted: () => "Unsorted",
    }),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: title ?? "Recipes",
          headerSearchBarOptions: {
            placeholder: "Search recipes",
            tintColor: accent,
            hideWhenScrolling: false,
            onChangeText: (event) => setSearch(event.nativeEvent.text),
          },
        }}
      />
      <ListLayoutMenu />
      <CollectionList
        items={recipes.map((recipe) => ({
          key: `${recipe.familyId}:${recipe.id}`,
          title: recipe.title,
          cover: (sizePt) => <RecipeThumbnail recipe={recipe} width={sizePt} />,
          details: <RecipeFacts recipe={recipe} />,
        }))}
        emptyState={
          isPending ? (
            <ActivityIndicator className="flex-1" />
          ) : search.trim() !== "" ? (
            <EmptyState
              icon="magnifyingglass"
              title={`No results for “${search.trim()}”`}
              description="Check the spelling, or search for an ingredient."
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
