import type { LibraryRecipe } from "../model/library";
import { Text, View } from "react-native";

import { RecipeFacts } from "./recipe-facts";
import { RecipeThumbnail } from "./recipe-thumbnail";

export function RecipeRow({ recipe }: { recipe: LibraryRecipe }) {
  return (
    <View className="flex-row items-center gap-3.5 px-4 py-2.5">
      <RecipeThumbnail recipe={recipe} width={56} />
      <View className="flex-1 gap-1">
        <Text numberOfLines={1} className="text-title text-foreground">
          {recipe.title}
        </Text>
        <RecipeFacts recipe={recipe} />
      </View>
    </View>
  );
}
