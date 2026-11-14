import { type RecipeDetail, formatDuration, formatQuantity } from "@lardon/recipes";
import { Text, View } from "react-native";

import { RecipeCover } from "#/entities/recipe";
import { iconSize, useThemeColors } from "#/shared/lib";
import { Glass, Icon, type IconName, LardonMark, PhotoFrame } from "#/shared/ui";

export function RecipeHero({ recipe, familyId }: { recipe: RecipeDetail; familyId: string }) {
  const { accent, white } = useThemeColors("accent", "white");
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
  const facts: { icon: IconName; label: string }[] = [];

  if (totalMinutes > 0) facts.push({ icon: "clock", label: formatDuration(totalMinutes) });

  if (recipe.servings !== undefined) {
    facts.push({
      icon: "person.2",
      label: recipe.servings === 1 ? "1 serving" : `${formatQuantity(recipe.servings)} servings`,
    });
  }

  return (
    <PhotoFrame className="aspect-4/3 w-full rounded-[24px] p-1">
      <View
        style={{ borderCurve: "continuous" }}
        className="flex-1 items-center justify-center overflow-hidden rounded-[20px] bg-placeholder"
      >
        {recipe.imageKey ? (
          <RecipeCover recipe={{ familyId, imageKey: recipe.imageKey }} />
        ) : (
          <LardonMark width={120} color={white} />
        )}
        {facts.length > 0 && (
          <View className="absolute inset-x-0 bottom-3.5 items-center">
            <View className="flex-row items-center rounded-full px-4.5 py-3">
              <Glass
                tintColor="rgba(255, 255, 255, 0.7)"
                className="absolute inset-0 rounded-full"
              />
              {facts.map((fact, index) => (
                <View key={fact.label} className="flex-row items-center">
                  {index > 0 && <View className="mx-3.5 h-3 w-px bg-muted/40" />}
                  <Icon name={fact.icon} size={iconSize.md} color={accent} />
                  <Text className="ml-2 text-body font-semibold text-foreground">{fact.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </PhotoFrame>
  );
}
