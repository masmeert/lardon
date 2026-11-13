import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";

import { refreshLibrary, signOut, useLibrary, useRecipes } from "#/shared/library";
import { useThemeColors } from "#/shared/lib";
import { Button, ButtonLabel, InlineError } from "#/shared/ui";

import { LibraryMessage } from "./library-message";
import { RecipeRow } from "./recipe-row";

export function LibraryScreen() {
  const { families, status } = useLibrary();
  const { accent } = useThemeColors("accent");
  const [search, setSearch] = useState("");
  const recipes = useRecipes(search);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string>();
  const [isRetrying, setIsRetrying] = useState(false);

  function confirmSignOut() {
    Alert.alert("Sign out?", "Your recipes stay in your account, ready when you sign back in.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          setIsSigningOut(true);
          setSignOutError(undefined);
          signOut().catch(() => {
            setIsSigningOut(false);
            setSignOutError("Couldn't sign out. Check your connection and try again");
          });
        },
      },
    ]);
  }

  function emptyState() {
    if (status === "loading") return <ActivityIndicator className="flex-1 pb-24" />;

    if (status === "unreachable") {
      return (
        <LibraryMessage
          title="Couldn't reach Lardon"
          description="Your recipes download the first time you sign in. Check your connection and try again."
        >
          <Button
            variant="secondary"
            isLoading={isRetrying}
            onPress={() => {
              setIsRetrying(true);
              void refreshLibrary().finally(() => setIsRetrying(false));
            }}
          >
            <ButtonLabel>Try again</ButtonLabel>
          </Button>
        </LibraryMessage>
      );
    }

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
        {isSigningOut ? (
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
        keyExtractor={(recipe) => `${recipe.family.id}:${recipe.id}`}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        className="flex-1 bg-background"
        contentContainerClassName="grow pt-2 pb-12"
        ListHeaderComponent={
          signOutError ? (
            <View className="items-start px-4 pb-3">
              <InlineError>{signOutError}</InlineError>
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
          <RecipeRow
            recipe={item}
            family={item.family}
            isFamilyShown={families.length > 1}
            isFirst={index === 0}
            isLast={index === recipes.length - 1}
          />
        )}
      />
    </>
  );
}
