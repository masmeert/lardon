import type { LibraryRecipe } from "../model/library";
import { Text, View } from "react-native";

import { RecipeFacts } from "./recipe-facts";
import { RecipeThumbnail } from "./recipe-thumbnail";

export function RecipeCard({ recipe, width }: { recipe: LibraryRecipe; width: number }) {
  return (
    <View className="items-center gap-3 px-4 pt-5 pb-4">
      <RecipeThumbnail recipe={recipe} width={width} />
      <View className="items-center gap-1.5 self-stretch">
        <Text numberOfLines={2} className="text-center text-title font-semibold text-foreground">
          {recipe.title}
        </Text>
        <RecipeFacts recipe={recipe} />
      </View>
    </View>
  );
}
