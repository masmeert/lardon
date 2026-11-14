import type { FeedRecipe } from "@lardon/api";
import { createRecipe, deleteRecipes, savedCopyOf, snapshotDraft } from "@lardon/recipes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Predicate } from "effect";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { Alert } from "react-native";

import { familiesQuery, useFamilyStores } from "#/entities/family";
import { useFamilyTables } from "#/entities/recipe";
import { apiErrorMessage, requestApi } from "#/shared/api";
import { authClient } from "#/shared/auth";
import type { IconName } from "#/shared/ui";

export function useSaveRecipe(published: FeedRecipe) {
  const familyStore = useFamilyStores();
  const { data: families = [] } = useQuery(familiesQuery);
  const { data: session } = authClient.useSession();
  const personal = families.find((family) => family.personal);
  const shared = families.find((family) => !family.personal);

  const savedCopy = useFamilyTables(families.map((family) => family.id)).flatMap(
    ({ familyId, tables }) => {
      const copy = savedCopyOf(tables, published.recipeId);

      return copy ? [{ familyId, recipeId: copy.id }] : [];
    },
  )[0];

  const destinations: { familyId: string; label: string; icon: IconName }[] = shared
    ? [
        { familyId: shared.id, label: shared.name, icon: "person.2" },
        ...(personal ? [{ familyId: personal.id, label: "Only me", icon: "lock" as const }] : []),
      ]
    : personal
      ? [{ familyId: personal.id, label: "My recipes", icon: "book" }]
      : [];

  async function copyPhoto(familyId: string) {
    try {
      const copied = await requestApi((client) =>
        client.feed.copyImage({ params: { recipeId: published.recipeId }, payload: { familyId } }),
      );

      return copied.imageKey;
    } catch (error) {
      if (Predicate.isTagged(error, "NotFound")) return null;

      throw error;
    }
  }

  const save = useMutation({
    networkMode: "always",
    mutationFn: async (familyId: string) => {
      const store = familyStore(familyId);
      const userId = session?.user.id;

      if (!store || !userId) throw new Error("Your recipes aren't loaded yet");

      const imageKey = published.imageKey ? await copyPhoto(familyId) : null;

      const recipeId = createRecipe(
        store,
        snapshotDraft(published.recipe, imageKey),
        userId,
        published.recipeId,
      );

      await notificationAsync(NotificationFeedbackType.Success);

      return recipeId;
    },
  });

  function unsave() {
    const store = savedCopy && familyStore(savedCopy.familyId);

    Alert.alert(
      `Remove “${published.recipe.title}” from your recipes?`,
      "The copy you saved is deleted. The original stays in Discover.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (store && savedCopy) deleteRecipes(store, [savedCopy.recipeId]);
            save.reset();
          },
        },
      ],
    );
  }

  return {
    save,
    savedCopy,
    unsave,
    destinations,
    errorMessage: save.isError
      ? apiErrorMessage(
          save.error,
          "Couldn't save this recipe. Check your connection and try again.",
        )
      : undefined,
  };
}
