import { cn, iconSize, useThemeColors } from "#/shared/lib";

import { Glass } from "./glass";
import { Icon } from "./icon";

export function SelectionCheck({ isSelected }: { isSelected: boolean }) {
  const { accent, white } = useThemeColors("accent", "white");

  return (
    <Glass
      tintColor={isSelected ? accent : undefined}
      className={cn(
        "size-7 items-center justify-center rounded-full",
        !isSelected && "border border-hairline",
      )}
    >
      {isSelected && <Icon name="checkmark" size={iconSize.sm} color={white} />}
    </Glass>
  );
}
