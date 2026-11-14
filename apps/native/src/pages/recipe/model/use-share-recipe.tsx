import {
  type RecipeDetail,
  RecipeDocument,
  type UnitSystem,
  recipeMarkdown,
  recipeSnapshot,
} from "@lardon/recipes";
import { useMutation } from "@tanstack/react-query";
import { setStringAsync } from "expo-clipboard";
import { File, Paths } from "expo-file-system";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { printToFileAsync } from "expo-print";
import { shareAsync } from "expo-sharing";
import { renderToStaticMarkup } from "react-dom/server.edge";
import { Share } from "react-native";

import { requestApi } from "#/shared/api";

async function photoDataUrl(familyId: string, imageKey: string) {
  const bytes = await requestApi((client) =>
    client.images.download({ params: { familyId, imageKey } }),
  );

  let binary = "";

  for (let start = 0; start < bytes.length; start += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  }

  const extension = imageKey.split(".")[1];

  return `data:image/${extension === "jpg" ? "jpeg" : extension};base64,${btoa(binary)}`;
}

export function useShareRecipe() {
  const link = useMutation({
    networkMode: "always",
    mutationFn: async ({ recipe, familyId }: { recipe: RecipeDetail; familyId: string }) => {
      const { url } = await requestApi((client) =>
        client.shares.create({
          payload: {
            familyId,
            recipeId: recipe.id,
            recipe: recipeSnapshot(recipe),
            imageKey: recipe.imageKey,
          },
        }),
      );

      await Share.share({ url });
    },
  });

  const pdf = useMutation({
    networkMode: "always",
    mutationFn: async ({
      recipe,
      familyId,
      scale,
      unitSystem,
    }: {
      recipe: RecipeDetail;
      familyId: string;
      scale: number;
      unitSystem: UnitSystem;
    }) => {
      const photoUrl = recipe.imageKey
        ? await photoDataUrl(familyId, recipe.imageKey).catch(() => null)
        : null;

      const { uri } = await printToFileAsync({
        width: 595,
        height: 842,
        margins: { top: 40, right: 0, bottom: 40, left: 0 },
        html: `<!doctype html>${renderToStaticMarkup(
          <RecipeDocument
            recipe={recipeSnapshot(recipe)}
            scale={scale}
            unitSystem={unitSystem}
            photoUrl={photoUrl}
          />,
        )}`,
      });

      const named = new File(Paths.cache, `${recipe.title.replace(/[/\\:*?"<>|]/g, "-")}.pdf`);

      if (named.exists) named.delete();

      await new File(uri).move(named);
      await shareAsync(named.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
    },
  });

  const copy = useMutation({
    networkMode: "always",
    mutationFn: async ({
      recipe,
      scale,
      unitSystem,
    }: {
      recipe: RecipeDetail;
      scale: number;
      unitSystem: UnitSystem;
    }) => {
      await setStringAsync(recipeMarkdown(recipeSnapshot(recipe), scale, unitSystem));
      await notificationAsync(NotificationFeedbackType.Success);
    },
    onSuccess: () => setTimeout(() => copy.reset(), 1500),
  });

  return { link, pdf, copy };
}
