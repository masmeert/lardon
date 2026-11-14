import { Stack, router } from "expo-router";
import { Alert } from "react-native";

import type { LibraryRecipe } from "#/entities/recipe";
import type { useOrganizeRecipes } from "#/features/organize-recipes";
import { addDays, calendarDay, relativeDayName } from "#/shared/lib";

export function recipeMenu({
  recipe,
  folderNames,
  tagNames,
  familyName,
  organize,
  weekPlan,
  canPlan,
  onPlan,
  onDeleted,
}: {
  recipe: LibraryRecipe & {
    folders: readonly { name: string }[];
    tags: readonly { name: string }[];
  };
  folderNames: readonly string[];
  tagNames: readonly string[];
  familyName: string | undefined;
  organize: ReturnType<typeof useOrganizeRecipes>;
  weekPlan: readonly { date: string; recipe: { id: string; title: string } }[];
  canPlan: boolean;
  onPlan: (day: string) => void;
  onDeleted: () => void;
}) {
  const { personalId, addTo, removeFrom, remove, move } = organize;
  const isPrivate = recipe.familyId === personalId;
  const today = calendarDay(new Date());

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
        {canPlan ? (
          <Stack.Toolbar.Menu title="Add to meal plan" icon="calendar.badge.plus">
            {[...Array(7).keys()].map((offset) => (
              <Stack.Toolbar.MenuAction
                key={offset}
                isOn={weekPlan.some(
                  (meal) => meal.date === addDays(today, offset) && meal.recipe.id === recipe.id,
                )}
                subtitle={
                  weekPlan.find(
                    (meal) => meal.date === addDays(today, offset) && meal.recipe.id !== recipe.id,
                  )?.recipe.title
                }
                onPress={() => onPlan(addDays(today, offset))}
              >
                {relativeDayName(addDays(today, offset), today)}
              </Stack.Toolbar.MenuAction>
            ))}
          </Stack.Toolbar.Menu>
        ) : (
          <Stack.Toolbar.MenuAction
            icon="calendar.badge.plus"
            disabled
            subtitle="Share it with your family first"
          >
            Add to meal plan
          </Stack.Toolbar.MenuAction>
        )}
        {familyName !== undefined && (
          <Stack.Toolbar.Menu title="Shared with" icon="person.2">
            <Stack.Toolbar.MenuAction
              icon="person.2"
              isOn={!isPrivate}
              onPress={() => isPrivate && move.mutate({ recipes: [recipe], isPrivate: false })}
            >
              {familyName}
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
      </Stack.Toolbar.Menu>
      <Stack.Toolbar.MenuAction
        icon="pencil"
        onPress={() =>
          router.push({ pathname: "/recipe/[recipeId]/edit", params: { recipeId: recipe.id } })
        }
      >
        Edit recipe
      </Stack.Toolbar.MenuAction>
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
