import { View } from "react-native";

import { type LibraryRecipe, RecipeThumbnail } from "#/entities/recipe";

export function RecipeStickers({ recipes }: { recipes: readonly LibraryRecipe[] }) {
  const firstRowLength = recipes.length > 5 ? Math.ceil(recipes.length / 2) : recipes.length;

  return (
    <View pointerEvents="none" className="items-center gap-3 py-2">
      {[recipes.slice(0, firstRowLength), recipes.slice(firstRowLength)].map(
        (row, rowIndex) =>
          row.length > 0 && (
            <View key={rowIndex} className="flex-row items-center">
              {row.map((recipe, index) => {
                const seed = Array.from(recipe.id).reduce(
                  (sum, character) => (sum * 31 + character.charCodeAt(0)) | 0,
                  7,
                );

                return (
                  <View
                    key={`${recipe.familyId}:${recipe.id}`}
                    style={{
                      marginLeft: index === 0 ? 0 : -14,
                      transform: [
                        {
                          rotate: `${(3 + (Math.abs(seed) % 7)) * ((index + rowIndex) % 2 === 0 ? -1 : 1)}deg`,
                        },
                        { translateY: (Math.abs(seed >> 3) % 9) - 4 },
                      ],
                    }}
                  >
                    <RecipeThumbnail recipe={recipe} width={64} />
                  </View>
                );
              })}
            </View>
          ),
      )}
    </View>
  );
}
