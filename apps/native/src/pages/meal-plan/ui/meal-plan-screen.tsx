import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, Text, View } from "react-native";

import { familiesQuery } from "#/entities/family";
import { libraryMealPlan, useFamilyTables } from "#/entities/recipe";
import { usePlanMeals } from "#/features/plan-meals";
import { addDays, calendarDay, endOfWeek, iconSize, useThemeColors } from "#/shared/lib";
import { Button, ButtonLabel, Icon } from "#/shared/ui";

import { DayCard } from "./day-card/day-card";

export function MealPlanScreen() {
  const today = calendarDay(new Date());
  const { accent, muted } = useThemeColors("accent", "muted");
  const { data: families = [], isPending } = useQuery(familiesQuery);
  const familyTables = useFamilyTables(families.map((family) => family.id));
  const planMeals = usePlanMeals();
  const [pastWeeks, setPastWeeks] = useState(0);
  const [comingWeeks, setComingWeeks] = useState(2);
  const firstDay = addDays(today, -7 * pastWeeks);

  const days = [...Array(7 * (pastWeeks + comingWeeks)).keys()].map((offset) =>
    addDays(firstDay, offset),
  );

  const meals = libraryMealPlan(familyTables, { from: firstDay, to: days.at(-1) ?? today });

  const weekMeals = meals.filter((meal) => meal.date >= today && meal.date <= endOfWeek(today));

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis" accessibilityLabel="More">
          <Stack.Toolbar.MenuAction
            icon="trash"
            destructive
            disabled={weekMeals.length === 0}
            onPress={() =>
              Alert.alert(
                "Clear this week?",
                `${weekMeals.length === 1 ? "1 planned meal" : `${weekMeals.length} planned meals`} ${endOfWeek(today) === today ? "for today" : "from today to Sunday"} will be removed from the plan.`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => planMeals.remove(weekMeals),
                  },
                ],
              )
            }
          >
            Clear week
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      {isPending ? (
        <ActivityIndicator className="flex-1" />
      ) : (
        <FlashList
          data={days}
          keyExtractor={(day) => day}
          maintainVisibleContentPosition={{ disabled: true }}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 64 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListFooterComponent={
            <Button
              variant="secondary"
              size="md"
              className="mt-5 self-center"
              onPress={() => setComingWeeks(comingWeeks + 2)}
            >
              <ButtonLabel>Show more days</ButtonLabel>
            </Button>
          }
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => setPastWeeks(pastWeeks + 1)}
              title={pastWeeks === 0 ? "Show past days" : "Show earlier days"}
              titleColor={muted}
              tintColor={muted}
            />
          }
          ListHeaderComponent={
            weekMeals.length === 0 ? (
              <View className="items-center gap-1.5 px-6 pt-2 pb-6">
                <Icon name="calendar.badge.plus" size={iconSize.xl} color={accent} />
                <Text className="pt-1 text-title font-semibold text-foreground">
                  Nothing planned this week
                </Text>
                <Text className="text-center text-body text-muted">
                  Tap + on a day to add a recipe.
                </Text>
              </View>
            ) : undefined
          }
          renderItem={({ item: day }) => (
            <DayCard
              day={day}
              today={today}
              meals={meals.filter((meal) => meal.date === day)}
              onMove={planMeals.move}
              onRemove={planMeals.remove}
            />
          )}
        />
      )}
    </>
  );
}
