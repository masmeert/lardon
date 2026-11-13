import { ScrollView } from "react-native";

import { EmptyState } from "#/shared/ui";

export function MealPlanScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="grow justify-center pb-24"
    >
      <EmptyState
        icon="calendar"
        title="Coming soon"
        description="Pick a recipe for each day of the week and see what's for dinner at a glance."
      />
    </ScrollView>
  );
}
