import { iconSize, useThemeColors } from "#/shared/lib";
import { Fan, Icon, type IconName } from "#/shared/ui";

import type { LibraryRecipe } from "../model/library";

import { RecipeThumbnail } from "./recipe-thumbnail";

export function RecipeFan({
  recipes,
  icon,
}: {
  recipes: readonly LibraryRecipe[];
  icon: IconName;
}) {
  const { muted } = useThemeColors("muted");

  if (recipes.length === 0) return <Icon name={icon} size={iconSize.xl} color={muted} />;

  return (
    <Fan spreadPt={24}>
      {[...recipes]
        .sort((first, second) => Number(Boolean(second.imageKey)) - Number(Boolean(first.imageKey)))
        .slice(0, 3)
        .map((recipe) => (
          <RecipeThumbnail key={`${recipe.familyId}:${recipe.id}`} recipe={recipe} width={52} />
        ))}
    </Fan>
  );
}
