import { type RecipeDetail, RecipeDocument, recipeSnapshot } from "@lardon/recipes";
import { useMutation } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
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
    mutationFn: async ({ recipe, familyId }: { recipe: RecipeDetail; familyId: string }) => {
      const photoUrl = recipe.imageKey
        ? await photoDataUrl(familyId, recipe.imageKey).catch(() => null)
        : null;

      const { uri } = await printToFileAsync({
        width: 595,
        height: 842,
        html: `<!doctype html>${renderToStaticMarkup(
          <RecipeDocument recipe={recipeSnapshot(recipe)} photoUrl={photoUrl} />,
        )}`,
      });

      const named = new File(Paths.cache, `${recipe.title.replace(/[/\\:*?"<>|]/g, "-")}.pdf`);

      if (named.exists) named.delete();

      await new File(uri).move(named);
      await shareAsync(named.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
    },
  });

  return { link, pdf };
}
