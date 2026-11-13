import { type LibraryRecipe, RecipeThumbnail } from "#/entities/recipe";
import { iconSize, useThemeColors } from "#/shared/lib";
import { Icon, type IconName } from "#/shared/ui";

export function FolderCover({
  preview,
  icon,
}: {
  preview: LibraryRecipe | undefined;
  icon: IconName;
}) {
  const { muted } = useThemeColors("muted");

  return preview ? (
    <RecipeThumbnail recipe={preview} width={58} />
  ) : (
    <Icon name={icon} size={iconSize.xl} color={muted} />
  );
}
