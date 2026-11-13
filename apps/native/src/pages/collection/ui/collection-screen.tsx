import { useQuery } from "@tanstack/react-query";
import { Match, Schema } from "effect";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View, useWindowDimensions } from "react-native";

import { familiesQuery } from "#/entities/family";
import {
  RecipeCard,
  RecipeRow,
  type RecipeScopeParams,
  libraryFolders,
  scopeFromParams,
  scopedRecipes,
  useFamilyTables,
} from "#/entities/recipe";
import { cn, useThemeColors } from "#/shared/lib";
import { usePreference } from "#/shared/preferences";
import { EmptyState } from "#/shared/ui";

const RecipeLayout = Schema.Literals(["list", "grid"]);

export function CollectionScreen() {
  const scope = scopeFromParams(useLocalSearchParams<RecipeScopeParams>());
  const { accent } = useThemeColors("accent");
  const { width } = useWindowDimensions();
  const { data: families = [], isPending } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));
  const [search, setSearch] = useState("");
  const recipes = scopedRecipes(familyTables, scope, search);
  const [layout, setLayout] = usePreference("recipeLayout", RecipeLayout, "list");
  const cardWidth = (width - 44) / 2;

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
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel="More">
          <Stack.Toolbar.MenuAction
            icon={layout === "grid" ? "list.bullet" : "square.grid.2x2"}
            onPress={() => setLayout(layout === "grid" ? "list" : "grid")}
          >
            {layout === "grid" ? "Show as list" : "Show as grid"}
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <FlatList
        key={layout}
        data={recipes}
        keyExtractor={(recipe) => `${recipe.familyId}:${recipe.id}`}
        numColumns={layout === "grid" ? 2 : 1}
        columnWrapperStyle={layout === "grid" ? { gap: 12 } : undefined}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        className="flex-1"
        contentContainerClassName={cn("grow px-4 pt-2 pb-16", layout === "grid" && "gap-3")}
        ItemSeparatorComponent={
          layout === "list"
            ? () => (
                <View className="bg-paper pl-21.5">
                  <View style={{ height: StyleSheet.hairlineWidth }} className="bg-hairline" />
                </View>
              )
            : undefined
        }
        renderItem={({ item, index }) => (
          <View
            style={{ borderCurve: "continuous", width: layout === "grid" ? cardWidth : undefined }}
            className={cn(
              "bg-paper",
              layout === "grid" && "rounded-card",
              layout === "list" && index === 0 && "rounded-t-card pt-1",
              layout === "list" && index === recipes.length - 1 && "rounded-b-card pb-1",
            )}
          >
            {layout === "grid" ? (
              <RecipeCard recipe={item} width={cardWidth - 32} />
            ) : (
              <RecipeRow recipe={item} />
            )}
          </View>
        )}
        ListEmptyComponent={
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
