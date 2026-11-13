import { ScrollView } from "react-native";

import { EmptyState } from "#/shared/ui";

export function DiscoverScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="grow justify-center pb-24"
    >
      <EmptyState
        icon="safari"
        title="Coming soon"
        description="New recipes from the people you follow will show up here."
      />
    </ScrollView>
  );
}
