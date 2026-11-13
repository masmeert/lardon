import { useThemeColors } from "#/shared/lib";
import { Fan, Icon, type IconName } from "#/shared/ui";

import type { LibraryRecipe } from "../model/library";

import { RecipeThumbnail } from "./recipe-thumbnail";

export function RecipeFan({
  recipes,
  icon,
  sizePt,
}: {
  recipes: readonly LibraryRecipe[];
  icon: IconName;
  sizePt: number;
}) {
  const { muted } = useThemeColors("muted");

  const photoRecipes = recipes.filter((recipe) => recipe.imageKey);

  if (photoRecipes.length === 0)
    return <Icon name={icon} size={Math.round(sizePt * 0.24)} color={muted} />;

  return (
    <Fan spreadPt={Math.round(sizePt * 0.25)}>
      {photoRecipes.slice(0, 3).map((recipe) => (
        <RecipeThumbnail
          key={`${recipe.familyId}:${recipe.id}`}
          recipe={recipe}
          width={Math.round(sizePt * 0.54)}
        />
      ))}
    </Fan>
  );
}
