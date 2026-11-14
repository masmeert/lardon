import type { FeedRecipe } from "@lardon/api";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { AuthorLine } from "#/entities/profile";
import { useSaveRecipe } from "#/features/save-recipe";
import { timeAgo } from "#/shared/lib";
import { InlineError } from "#/shared/ui";

import { RecipePages } from "./recipe-pages";

export function FeedCard({
  published,
  showsAuthor,
}: {
  published: FeedRecipe;
  showsAuthor: boolean;
}) {
  const saving = useSaveRecipe(published);
  const { recipe, recipeId } = published;
  const when = timeAgo(published.publishedAt, Date.now());

  function open() {
    router.push({ pathname: "/feed/[recipeId]", params: { recipeId } });
  }

  return (
    <View className="py-5">
      <View className="min-h-9 flex-row items-center gap-3 px-4">
        <View className="flex-1">
          {showsAuthor ? (
            <AuthorLine
              author={published.author}
              detail={when}
              onPress={() =>
                router.push({
                  pathname: "/u/[username]",
                  params: { username: published.author.username },
                })
              }
            />
          ) : (
            <Text className="text-label text-muted">{when}</Text>
          )}
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={open}
        className="px-4 pt-3.5 pb-3 active:opacity-70"
      >
        <Text className="text-headline font-bold text-foreground">{recipe.title}</Text>
      </Pressable>
      <RecipePages published={published} saving={saving} onOpen={open} />
      {saving.errorMessage && (
        <View className="items-start px-4 pt-3">
          <InlineError>{saving.errorMessage}</InlineError>
        </View>
      )}
    </View>
  );
}
