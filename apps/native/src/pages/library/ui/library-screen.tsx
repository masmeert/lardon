import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";
import { useStore } from "tinybase/ui-react";

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

  const family =
    families.find((candidate) => candidate.id === chosenFamilyId) ??
    families.find((candidate) => candidate.personal) ??
    families[0];

  const [search, setSearch] = useState("");
  const recipes = useRecipes(family?.id ?? "", search);
  const isStoreOpen = useStore(family?.id ?? "") !== undefined;
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

    if (!isStoreOpen) return <ActivityIndicator className="flex-1 pb-24" />;

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
            {families.map((candidate) => (
              <Stack.Toolbar.MenuAction
                key={candidate.id}
                isOn={candidate.id === family?.id}
                onPress={() => setChosenFamilyId(candidate.id)}
              >
                {candidate.name}
              </Stack.Toolbar.MenuAction>
            ))}
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
        keyExtractor={(recipe) => recipe.id}
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
