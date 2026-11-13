import { Text, View } from "react-native";

import { cn, iconSize, useThemeColors } from "#/shared/lib";

import { Icon } from "../icon";

import type { CollectionItem } from "./collection-item";

export function CollectionFacts({
  facts,
  isOnCover = false,
}: {
  facts: NonNullable<CollectionItem["facts"]>;
  isOnCover?: boolean;
}) {
  const { muted } = useThemeColors("muted");

  if (facts.length === 0) return null;

  return (
    <View
      className={cn(
        "flex-row items-center gap-2.5 self-start rounded-full px-2.5 py-1",
        isOnCover ? "bg-paper shadow-rim" : "bg-fill",
      )}
    >
      {facts.map((fact) => (
        <View key={fact.label} className="flex-row items-center gap-1">
          {fact.icon && <Icon name={fact.icon} size={iconSize.sm} color={muted} />}
          <Text
            className={cn("text-label font-medium", isOnCover ? "text-foreground" : "text-muted")}
          >
            {fact.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
