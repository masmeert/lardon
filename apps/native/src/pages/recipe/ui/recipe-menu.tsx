import { Stack } from "expo-router";
import { Alert } from "react-native";

import type { LibraryRecipe } from "#/entities/recipe";
import type { useOrganizeRecipes } from "#/features/organize-recipes";

export function recipeMenu({
  recipe,
  folderNames,
  tagNames,
  organize,
  onDeleted,
}: {
  recipe: LibraryRecipe & {
    folders: readonly { name: string }[];
    tags: readonly { name: string }[];
  };
  folderNames: readonly string[];
  tagNames: readonly string[];
  organize: ReturnType<typeof useOrganizeRecipes>;
  onDeleted: () => void;
}) {
  const { hasFamily, personalId, addTo, removeFrom, remove, move } = organize;
  const isPrivate = recipe.familyId === personalId;

  function isIn(owners: readonly { name: string }[], name: string) {
    return owners.some((owner) => owner.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  }

  return (
    <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel="More">
      <Stack.Toolbar.Menu inline>
        <Stack.Toolbar.Menu title="Folders" icon="folder">
          {folderNames.length === 0 && (
            <Stack.Toolbar.MenuAction disabled>No folders yet</Stack.Toolbar.MenuAction>
          )}
          {folderNames.map((name) => (
            <Stack.Toolbar.MenuAction
              key={name}
              isOn={isIn(recipe.folders, name)}
              onPress={() =>
                isIn(recipe.folders, name)
                  ? removeFrom("folders", name, [recipe])
                  : addTo("folders", name, [recipe])
              }
            >
              {name}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
        <Stack.Toolbar.Menu title="Tags" icon="tag">
          {tagNames.length === 0 && (
            <Stack.Toolbar.MenuAction disabled>No tags yet</Stack.Toolbar.MenuAction>
          )}
          {tagNames.map((name) => (
            <Stack.Toolbar.MenuAction
              key={name}
              isOn={isIn(recipe.tags, name)}
              onPress={() =>
                isIn(recipe.tags, name)
                  ? removeFrom("tags", name, [recipe])
                  : addTo("tags", name, [recipe])
              }
            >
              {name}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar.Menu>
      {hasFamily && (
        <Stack.Toolbar.Menu inline title="Who can see it">
          <Stack.Toolbar.MenuAction
            icon="person.2"
            isOn={!isPrivate}
            onPress={() => isPrivate && move.mutate({ recipes: [recipe], isPrivate: false })}
          >
            Your family
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            icon="lock"
            isOn={isPrivate}
            onPress={() => !isPrivate && move.mutate({ recipes: [recipe], isPrivate: true })}
          >
            Only me
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      )}
      <Stack.Toolbar.MenuAction
        icon="trash"
        destructive
        onPress={() =>
          Alert.alert(
            `Delete “${recipe.title}”?`,
            isPrivate
              ? "This can't be undone."
              : "It'll be deleted for everyone in your family. This can't be undone.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  remove([recipe]);
                  onDeleted();
                },
              },
            ],
          )
        }
      >
        Delete recipe
      </Stack.Toolbar.MenuAction>
    </Stack.Toolbar.Menu>
  );
}
