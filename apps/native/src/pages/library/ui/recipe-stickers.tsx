import { View } from "react-native";

import { RecipeThumbnail } from "#/entities/recipe";

export function RecipeStickers({ recipeIds }: { recipeIds: readonly string[] }) {
  const firstRowLength = recipeIds.length > 5 ? Math.ceil(recipeIds.length / 2) : recipeIds.length;

  return (
    <View pointerEvents="none" className="items-center gap-3 py-2">
      {[recipeIds.slice(0, firstRowLength), recipeIds.slice(firstRowLength)].map(
        (row, rowIndex) =>
          row.length > 0 && (
            <View key={rowIndex} className="flex-row items-center">
              {row.map((recipeId, index) => {
                const seed = Array.from(recipeId).reduce(
                  (sum, character) => (sum * 31 + character.charCodeAt(0)) | 0,
                  7,
                );

                return (
                  <View
                    key={recipeId}
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
                    <RecipeThumbnail width={64} />
                  </View>
                );
              })}
            </View>
          ),
      )}
    </View>
  );
}
