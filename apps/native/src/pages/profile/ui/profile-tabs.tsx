import { Pressable, StyleSheet, Text, View } from "react-native";

import { cn } from "#/shared/lib";

export type ProfileTab = "recipes" | "stats";

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "recipes", label: "Recipes" },
  { id: "stats", label: "Stats" },
];

export function ProfileTabs({
  selected,
  onSelect,
}: {
  selected: ProfileTab;
  onSelect: (tab: ProfileTab) => void;
}) {
  return (
    <View accessibilityRole="tablist" className="mx-4 mb-3 flex-row">
      <View
        style={{ height: StyleSheet.hairlineWidth }}
        className="absolute inset-x-0 bottom-0 bg-muted/40"
      />
      {tabs.map((tab) => {
        const isSelected = tab.id === selected;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(tab.id)}
            className="flex-1 items-center active:opacity-60"
          >
            <Text
              className={cn(
                "pb-2 text-body",
                isSelected ? "font-semibold text-accent" : "text-muted",
              )}
            >
              {tab.label}
            </Text>
            <View className={cn("h-0.5 self-stretch rounded-full", isSelected && "bg-accent")} />
          </Pressable>
        );
      })}
    </View>
  );
}
