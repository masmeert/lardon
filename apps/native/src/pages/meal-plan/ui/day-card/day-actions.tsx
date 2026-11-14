import { Button, Divider, HStack, Host, Image, Menu } from "@expo/ui/swift-ui";
import { accessibilityLabel, buttonStyle, disabled, frame } from "@expo/ui/swift-ui/modifiers";
import { Alert } from "react-native";

import type { LibraryMeal } from "#/entities/recipe";
import { addDays, relativeDayName, useThemeColors, weekdayName } from "#/shared/lib";

import { MealMenu } from "./meal-menu";

export function DayActions({
  day,
  today,
  meals,
  onAdd,
  onMove,
  onRemove,
}: {
  day: string;
  today: string;
  meals: readonly LibraryMeal[];
  onAdd: () => void;
  onMove: (meals: readonly LibraryMeal[], day: string) => void;
  onRemove: (meals: readonly LibraryMeal[]) => void;
}) {
  const { foreground, muted } = useThemeColors("foreground", "muted");

  const moveDays = [...Array(8).keys()].flatMap((offset) =>
    addDays(today, offset) === day ? [] : [addDays(today, offset)],
  );

  return (
    <Host ignoreSafeArea="all" matchContents>
      <HStack spacing={4}>
        <Button
          onPress={onAdd}
          modifiers={[buttonStyle("borderless"), accessibilityLabel(`Add to ${weekdayName(day)}`)]}
        >
          <Image
            systemName="plus"
            size={18}
            color={foreground}
            modifiers={[frame({ width: 36, height: 36 })]}
          />
        </Button>
        <Menu
          label={
            <Image
              systemName="ellipsis"
              size={18}
              color={meals.length === 0 ? muted : foreground}
              modifiers={[frame({ width: 36, height: 36 })]}
            />
          }
          modifiers={[
            buttonStyle("borderless"),
            accessibilityLabel(`${weekdayName(day)} options`),
            disabled(meals.length === 0),
          ]}
        >
          {meals.map((meal) => (
            <MealMenu
              key={meal.id}
              meal={meal}
              moveDays={moveDays}
              today={today}
              onMove={(target) => onMove([meal], target)}
              onRemove={() => onRemove([meal])}
            />
          ))}
          <Divider />
          {meals.length > 1 && (
            <Menu label="Move all to" systemImage="calendar">
              {moveDays.map((target) => (
                <Button
                  key={target}
                  label={relativeDayName(target, today)}
                  onPress={() => onMove(meals, target)}
                />
              ))}
            </Menu>
          )}
          <Button
            label="Clear day"
            systemImage="trash"
            role="destructive"
            onPress={() =>
              Alert.alert(
                `Clear ${relativeDayName(day, today)}?`,
                meals.length === 1
                  ? "Its meal will be removed from the plan."
                  : `Its ${meals.length} meals will be removed from the plan.`,
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Clear", style: "destructive", onPress: () => onRemove(meals) },
                ],
              )
            }
          />
        </Menu>
      </HStack>
    </Host>
  );
}
