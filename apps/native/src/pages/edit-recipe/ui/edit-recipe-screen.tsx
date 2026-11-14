import { readRow, saveRecipe } from "@lardon/recipes";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";

import { familiesQuery, useFamilyStores } from "#/entities/family";
import {
  RecipeEditorToolbar,
  RecipeForm,
  RecipeFormError,
  baseDraft,
  revisionDraft,
  uploadPhoto,
  useConfirmDiscard,
  useRecipeEditor,
} from "#/features/edit-recipe";
import { useOrganizeRecipes } from "#/features/organize-recipes";

export function EditRecipeScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const { base, fields } = useRecipeEditor();
  const { data: families = [] } = useQuery(familiesQuery);
  const familyStore = useFamilyStores();
  const { move } = useOrganizeRecipes();
  const shared = families.find((family) => !family.personal);

  const leave = useConfirmDiscard({
    title: "Discard your changes?",
    message: "Your edits to this recipe won't be saved.",
  });

  const save = useMutation({
    mutationFn: async () => {
      const sourceId = families.find((family) =>
        familyStore(family.id)?.hasRow("recipes", recipeId),
      )?.id;

      const targetId = shared
        ? fields.isPrivate
          ? families.find((family) => family.personal)?.id
          : shared.id
        : sourceId;

      const gone = new RecipeFormError(
        "title",
        "This recipe was deleted, maybe on another device.",
      );

      if (!sourceId || !targetId) throw gone;

      const imageKey = fields.photoUri
        ? await uploadPhoto(fields.photoUri, targetId)
        : fields.imageKey;

      if (targetId !== sourceId) {
        const source = familyStore(sourceId);
        const recipe = source && readRow(source.getTables(), "recipes", recipeId);

        if (!recipe) throw gone;

        await move
          .mutateAsync({
            recipes: [{ ...recipe, familyId: sourceId }],
            isPrivate: fields.isPrivate,
          })
          .catch(() => {
            throw new RecipeFormError(
              "details",
              fields.isPrivate
                ? "Couldn't make it private. Check your connection and try again."
                : `Couldn't share it with ${shared?.name ?? "your family"}. Check your connection and try again.`,
            );
          });
      }

      const target = familyStore(targetId);

      const isSaved =
        target?.transaction(() =>
          saveRecipe(
            target,
            recipeId,
            baseDraft(base, target),
            revisionDraft(fields, base, target, imageKey),
          ),
        ) ?? false;

      if (!isSaved) throw gone;
    },
    onSuccess: () => leave(router.back),
  });

  return (
    <>
      <RecipeEditorToolbar
        saveLabel="Save changes"
        canSave={fields.title.trim().length > 0}
        isSaving={save.isPending}
        onSave={() => save.mutate()}
      />
      <RecipeForm
        familyName={shared?.name}
        hrefs={{
          folders: { pathname: "/recipe/[recipeId]/edit/folders", params: { recipeId } },
          tags: { pathname: "/recipe/[recipeId]/edit/tags", params: { recipeId } },
        }}
        saveError={save.error}
      />
    </>
  );
}
