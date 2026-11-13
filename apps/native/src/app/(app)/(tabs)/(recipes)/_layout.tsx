import { Stack } from "expo-router";

import { TabStack } from "#/_app/nav/tab-stack";

export default function RecipesLayout() {
  return (
    <TabStack title="Recipes">
      <Stack.Screen name="collection" options={{ headerBackButtonDisplayMode: "minimal" }} />
    </TabStack>
  );
}
