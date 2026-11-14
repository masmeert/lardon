import { Button, Menu } from "@expo/ui/swift-ui";

import type { LibraryMeal } from "#/entities/recipe";
import { relativeDayName } from "#/shared/lib";

export function MealMenu({
  meal,
  moveDays,
  today,
  onMove,
  onRemove,
}: {
  meal: LibraryMeal;
  moveDays: readonly string[];
  today: string;
  onMove: (day: string) => void;
  onRemove: () => void;
}) {
  return (
    <Menu label={meal.recipe.title} systemImage="fork.knife">
      <Menu label="Move to" systemImage="calendar">
        {moveDays.map((day) => (
          <Button key={day} label={relativeDayName(day, today)} onPress={() => onMove(day)} />
        ))}
      </Menu>
      <Button label="Remove" systemImage="trash" role="destructive" onPress={onRemove} />
    </Menu>
  );
}
