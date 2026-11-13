import { Text, View } from "react-native";

import { cn, iconSize, useThemeColors } from "#/shared/lib";

import { Glass } from "../glass";
import { Icon } from "../icon";

import type { CollectionItem } from "./collection-item";

export function CollectionFacts({
  facts,
  isOnCover = false,
}: {
  facts: NonNullable<CollectionItem["facts"]>;
  isOnCover?: boolean;
}) {
  const { muted, foreground } = useThemeColors("muted", "foreground");

  if (facts.length === 0) return null;

  return (
    <View
      className={cn(
        "flex-row items-center gap-2.5 self-start rounded-full px-2.5 py-1",
        !isOnCover && "bg-fill",
      )}
    >
      {isOnCover && (
        <Glass tintColor="rgba(255, 255, 255, 0.7)" className="absolute inset-0 rounded-full" />
      )}
      {facts.map((fact) => (
        <View key={fact.label} className="flex-row items-center gap-1">
          {fact.icon && (
            <Icon name={fact.icon} size={iconSize.sm} color={isOnCover ? foreground : muted} />
          )}
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
