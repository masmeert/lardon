import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";
import { useStoreIds } from "tinybase/ui-react";

import { familiesQuery, useSignOut } from "#/entities/family";
import { useRecipes } from "#/entities/recipe";
import { useThemeColors } from "#/shared/lib";
import { Button, ButtonLabel, InlineError } from "#/shared/ui";

import { LibraryMessage } from "./library-message";
import { RecipeRow } from "./recipe-row";

export function LibraryScreen() {
  const { accent } = useThemeColors("accent");
  const familyList = useQuery(familiesQuery);
  const families = familyList.data ?? [];
  const [chosenFamilyId, setChosenFamilyId] = useState<string>();
  const chosenFamily = families.find((family) => family.id === chosenFamilyId);
  const shownFamilies = chosenFamily ? [chosenFamily] : families;
  const [search, setSearch] = useState("");

  const recipes = useRecipes(
    shownFamilies.map((family) => family.id),
    search,
  );

  const openStoreIds = useStoreIds();

  const isLoading =
    familyList.isPending || shownFamilies.some((family) => !openStoreIds.includes(family.id));

  const signOut = useSignOut();

  function confirmSignOut() {
    Alert.alert("Sign out?", "Your recipes stay in your account, ready when you sign back in.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut.mutate() },
    ]);
  }

  function emptyState() {
    if (familyList.isError && !familyList.data) {
      return (
        <LibraryMessage
          title="Couldn't reach Lardon"
          description="Your recipes download the first time you sign in. Check your connection and try again."
        >
          <Button
            variant="secondary"
            isLoading={familyList.isFetching}
            onPress={() => void familyList.refetch()}
          >
            <ButtonLabel>Try again</ButtonLabel>
          </Button>
        </LibraryMessage>
      );
    }

    if (isLoading) return <ActivityIndicator className="flex-1 pb-24" />;

    if (search.trim() !== "") {
      return (
        <LibraryMessage
          title="No matches"
          description={`No recipe title or ingredient matches “${search.trim()}”.`}
        />
      );
    }

    return (
      <LibraryMessage
        title="No recipes yet"
        description="Recipes you and your family add show up here."
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Recipes",
          headerLargeTitleEnabled: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerLargeTitleShadowVisible: false,
          scrollEdgeEffects: { top: "soft" },
          headerSearchBarOptions: {
            placeholder: "Search recipes",
            tintColor: accent,
            hideWhenScrolling: false,
            onChangeText: (event) => setSearch(event.nativeEvent.text),
          },
        }}
      />
      <Stack.Toolbar placement="right">
        {families.length > 1 && (
          <Stack.Toolbar.Menu
            icon="line.3.horizontal.decrease.circle"
            accessibilityLabel="Choose a family"
          >
            <Stack.Toolbar.MenuAction
              isOn={chosenFamily === undefined}
              onPress={() => setChosenFamilyId(undefined)}
            >
              All families
            </Stack.Toolbar.MenuAction>
            <Stack.Toolbar.Menu inline>
              {families.map((family) => (
                <Stack.Toolbar.MenuAction
                  key={family.id}
                  isOn={family.id === chosenFamily?.id}
                  onPress={() => setChosenFamilyId(family.id)}
                >
                  {family.name}
                </Stack.Toolbar.MenuAction>
              ))}
            </Stack.Toolbar.Menu>
          </Stack.Toolbar.Menu>
        )}
        {signOut.isPending ? (
          <Stack.Toolbar.View>
            <ActivityIndicator />
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Menu icon="person.crop.circle" accessibilityLabel="Account">
            <Stack.Toolbar.MenuAction
              icon="rectangle.portrait.and.arrow.right"
              destructive
              onPress={confirmSignOut}
            >
              Sign out
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        )}
      </Stack.Toolbar>
      <FlatList
        data={recipes}
        keyExtractor={(recipe) => `${recipe.familyId}:${recipe.id}`}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        className="flex-1 bg-background"
        contentContainerClassName="grow pt-2 pb-12"
        ListHeaderComponent={
          signOut.isError ? (
            <View className="items-start px-4 pb-3">
              <InlineError>Couldn't sign out. Check your connection and try again</InlineError>
            </View>
          ) : undefined
        }
        ListEmptyComponent={emptyState()}
        ItemSeparatorComponent={() => (
          <View className="mx-4 bg-paper pl-18">
            <View style={{ height: StyleSheet.hairlineWidth }} className="bg-hairline" />
          </View>
        )}
        renderItem={({ item, index }) => (
          <RecipeRow recipe={item} isFirst={index === 0} isLast={index === recipes.length - 1} />
        )}
      />
    </>
  );
}
