import { createRecipe } from "@lardon/recipes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";

import { familiesQuery, useFamilyStores } from "#/entities/family";
import {
  RecipeEditorToolbar,
  RecipeForm,
  revisionDraft,
  uploadPhoto,
  useConfirmDiscard,
  useRecipeEditor,
} from "#/features/edit-recipe";
import { authClient } from "#/shared/auth";

export function NewRecipeScreen() {
  const { base, fields } = useRecipeEditor();
  const { data: families = [] } = useQuery(familiesQuery);
  const { data: session } = authClient.useSession();
  const familyStore = useFamilyStores();
  const shared = families.find((family) => !family.personal);

  const leave = useConfirmDiscard({
    title: "Discard this recipe?",
    message: "What you've written so far won't be saved.",
  });

  const save = useMutation({
    mutationFn: async () => {
      const family =
        fields.isPrivate || !shared ? families.find((candidate) => candidate.personal) : shared;

      const store = family && familyStore(family.id);

      if (!family || !store || !session) throw new Error("Your recipes haven't loaded yet");
      const imageKey = fields.photoUri ? await uploadPhoto(fields.photoUri, family.id) : null;

      return store.transaction(() =>
        createRecipe(store, revisionDraft(fields, base, store, imageKey), session.user.id),
      );
    },
    onSuccess: (recipeId) =>
      leave(() => {
        router.back();
        router.push({ pathname: "/recipe/[recipeId]", params: { recipeId } });
      }),
  });

  return (
    <>
      <RecipeEditorToolbar
        saveLabel="Save recipe"
        canSave={fields.title.trim().length > 0}
        isSaving={save.isPending}
        onSave={() => save.mutate()}
      />
      <RecipeForm
        familyName={shared?.name}
        hrefs={{ folders: "/recipe/new/folders", tags: "/recipe/new/tags" }}
        saveError={save.error}
      />
    </>
  );
}
