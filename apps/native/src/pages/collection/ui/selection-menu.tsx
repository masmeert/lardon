import { Stack } from "expo-router";
import { Alert } from "react-native";

import type { LibraryRecipe, RecipeScope } from "#/entities/recipe";
import type { useOrganizeRecipes } from "#/features/organize-recipes";

export function selectionMenu({
  recipes,
  scope,
  folderNames,
  tagNames,
  organize,
  onDone,
}: {
  recipes: readonly LibraryRecipe[];
  scope: RecipeScope;
  folderNames: readonly string[];
  tagNames: readonly string[];
  organize: ReturnType<typeof useOrganizeRecipes>;
  onDone: () => void;
}) {
  const { hasFamily, personalId, addTo, removeFrom, remove, move } = organize;
  const isEmpty = recipes.length === 0;
  const privateCount = recipes.filter((recipe) => recipe.familyId === personalId).length;

  function confirmDelete() {
    const count = recipes.length === 1 ? "this recipe" : `${recipes.length} recipes`;

    Alert.alert(
      `Delete ${count}?`,
      privateCount === recipes.length
        ? "This can't be undone."
        : "They'll be deleted for everyone in your family. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            remove(recipes);
            onDone();
          },
        },
      ],
    );
  }

  return (
    <Stack.Toolbar.Menu icon="ellipsis.circle" accessibilityLabel="Actions" disabled={isEmpty}>
      <Stack.Toolbar.Menu inline>
        <Stack.Toolbar.Menu title="Add to folder" icon="folder.badge.plus">
          {folderNames.length === 0 && (
            <Stack.Toolbar.MenuAction disabled>No folders yet</Stack.Toolbar.MenuAction>
          )}
          {folderNames.map((name) => (
            <Stack.Toolbar.MenuAction
              key={name}
              onPress={() => {
                addTo("folders", name, recipes);
                onDone();
              }}
            >
              {name}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.Menu title="Add tag" icon="tag">
          {tagNames.length === 0 && (
            <Stack.Toolbar.MenuAction disabled>No tags yet</Stack.Toolbar.MenuAction>
          )}
          {tagNames.map((name) => (
            <Stack.Toolbar.MenuAction
              key={name}
              onPress={() => {
                addTo("tags", name, recipes);
                onDone();
              }}
            >
              {name}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
        {(scope.kind === "folder" || scope.kind === "tag") && (
          <Stack.Toolbar.MenuAction
            icon={scope.kind === "folder" ? "folder.badge.minus" : "tag.slash"}
            onPress={() => {
              removeFrom(scope.kind === "folder" ? "folders" : "tags", scope.name, recipes);
              onDone();
            }}
          >
            {`Remove from “${scope.name}”`}
          </Stack.Toolbar.MenuAction>
        )}
      </Stack.Toolbar.Menu>
      {hasFamily && (
        <Stack.Toolbar.Menu inline>
          {privateCount < recipes.length && (
            <Stack.Toolbar.MenuAction
              icon="lock"
              onPress={() => move.mutate({ recipes, isPrivate: true }, { onSuccess: onDone })}
            >
              Only me
            </Stack.Toolbar.MenuAction>
          )}
          {privateCount > 0 && (
            <Stack.Toolbar.MenuAction
              icon="person.2"
              onPress={() => move.mutate({ recipes, isPrivate: false }, { onSuccess: onDone })}
            >
              Share with family
            </Stack.Toolbar.MenuAction>
          )}
        </Stack.Toolbar.Menu>
      )}
      <Stack.Toolbar.MenuAction icon="trash" destructive onPress={confirmDelete}>
        Delete
      </Stack.Toolbar.MenuAction>
    </Stack.Toolbar.Menu>
  );
}
