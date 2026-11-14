import { NativeTabs } from "expo-router/native-tabs";

import { useThemeColors } from "#/shared/lib";

export function TabsLayout() {
  const { accent } = useThemeColors("accent");

  return (
    <NativeTabs tintColor={accent}>
      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "safari", selected: "safari.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="meal-plan">
        <NativeTabs.Trigger.Label>Meal plan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(recipes)">
        <NativeTabs.Trigger.Label>Recipes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "book", selected: "book.fill" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
