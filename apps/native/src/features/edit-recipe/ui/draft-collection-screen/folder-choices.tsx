import { Pressable } from "react-native";

import { GroupedRow, GroupedSection, SelectionCheck } from "#/shared/ui";

export function FolderChoices({
  folders,
  isChosen,
  onToggle,
}: {
  folders: readonly { name: string; recipeCount: number | undefined }[];
  isChosen: (name: string) => boolean;
  onToggle: (name: string) => void;
}) {
  return (
    <GroupedSection>
      {folders.map(({ name, recipeCount }, index) => (
        <Pressable
          key={name}
          accessibilityRole="button"
          accessibilityState={{ selected: isChosen(name) }}
          onPress={() => onToggle(name)}
          className="active:opacity-70"
        >
          <GroupedRow
            label={name}
            detail={
              recipeCount === undefined
                ? "New folder"
                : recipeCount === 1
                  ? "1 recipe"
                  : `${recipeCount} recipes`
            }
            size="lg"
            isFirst={index === 0}
          >
            <SelectionCheck isSelected={isChosen(name)} />
          </GroupedRow>
        </Pressable>
      ))}
    </GroupedSection>
  );
}
