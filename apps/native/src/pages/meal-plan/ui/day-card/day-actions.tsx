import { Button, Host, Image, Menu, Text } from "@expo/ui/swift-ui";
import { accessibilityLabel, buttonStyle, frame } from "@expo/ui/swift-ui/modifiers";

import { relativeDayName, useThemeColors, weekdayName } from "#/shared/lib";

export function DayActions({
  day,
  today,
  isPlanned,
  moveDays,
  plannedDays,
  onAdd,
  onMove,
  onRemove,
}: {
  day: string;
  today: string;
  isPlanned: boolean;
  moveDays: readonly string[];
  plannedDays: ReadonlyMap<string, string>;
  onAdd: () => void;
  onMove: (target: string) => void;
  onRemove: () => void;
}) {
  const { foreground } = useThemeColors("foreground");

  return (
    <Host ignoreSafeArea="all" matchContents>
      {isPlanned ? (
        <Menu
          label={
            <Image
              systemName="ellipsis"
              size={18}
              color={foreground}
              modifiers={[frame({ width: 36, height: 36 })]}
            />
          }
          modifiers={[buttonStyle("borderless"), accessibilityLabel(`${weekdayName(day)} options`)]}
        >
          <Button label="Change recipe" systemImage="arrow.triangle.2.circlepath" onPress={onAdd} />
          <Menu label="Move to" systemImage="calendar">
            {moveDays.map((target) => (
              <Button key={target} onPress={() => onMove(target)}>
                {[
                  relativeDayName(target, today),
                  ...(plannedDays.has(target) ? [`Swap with ${plannedDays.get(target)}`] : []),
                ].map((line) => (
                  <Text key={line}>{line}</Text>
                ))}
              </Button>
            ))}
          </Menu>
          <Button label="Remove" systemImage="trash" role="destructive" onPress={onRemove} />
        </Menu>
      ) : (
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
      )}
    </Host>
  );
}
