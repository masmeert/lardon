import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import type { LibraryMeal } from "#/entities/recipe";
import { addDays, cn, shortDate, weekdayName } from "#/shared/lib";

import { DayActions } from "./day-actions";
import { MealRow } from "./meal-row";

export function DayCard({
  day,
  today,
  meals,
  plannedDays,
  onMove,
  onRemove,
}: {
  day: string;
  today: string;
  meals: readonly LibraryMeal[];
  plannedDays: ReadonlyMap<string, string>;
  onMove: (target: string) => void;
  onRemove: () => void;
}) {
  const moveDays = [...Array(8).keys()].flatMap((offset) =>
    addDays(today, offset) === day ? [] : [addDays(today, offset)],
  );

  return (
    <View
      style={{ borderCurve: "continuous" }}
      className={cn("overflow-hidden rounded-card bg-paper", day < today && "opacity-70")}
    >
      <View className="flex-row items-center gap-3 py-1.5 pr-2 pl-4">
        <View className="flex-1 flex-row flex-wrap items-baseline gap-x-1.5">
          <Text
            accessibilityRole="header"
            className={cn(
              "text-title font-semibold",
              day === today ? "text-accent" : "text-foreground",
            )}
          >
            {day === today ? "Today" : weekdayName(day)}
          </Text>
          <Text className="text-caption text-muted">{shortDate(day)}</Text>
        </View>
        <DayActions
          day={day}
          today={today}
          isPlanned={meals.length > 0}
          moveDays={moveDays}
          plannedDays={plannedDays}
          onAdd={() => router.push({ pathname: "/plan/[date]", params: { date: day } })}
          onMove={onMove}
          onRemove={onRemove}
        />
      </View>
      {meals.length > 0 && (
        <>
          <View style={{ height: StyleSheet.hairlineWidth }} className="ml-4 bg-hairline" />
          <View className="py-1">
            {meals.map((meal, index) => (
              <MealRow key={meal.familyId} meal={meal} isFirst={index === 0} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}
