import { Text, View } from "react-native";

import { cn, iconSize, useThemeColors } from "#/shared/lib";

import { Icon } from "../icon";

import type { CollectionItem } from "./collection-item";

export function CollectionFacts({
  facts,
  isOnPhoto = false,
}: {
  facts: NonNullable<CollectionItem["facts"]>;
  isOnPhoto?: boolean;
}) {
  const { muted, white } = useThemeColors("muted", "white");

  if (facts.length === 0) return null;

  return (
    <View
      className={cn(
        "flex-row items-center gap-2.5 self-start rounded-full px-2.5 py-1",
        isOnPhoto ? "bg-black/40" : "bg-fill",
      )}
    >
      {facts.map((fact) => (
        <View key={fact.label} className="flex-row items-center gap-1">
          {fact.icon && (
            <Icon name={fact.icon} size={iconSize.sm} color={isOnPhoto ? white : muted} />
          )}
          <Text className={cn("text-label font-medium", isOnPhoto ? "text-white" : "text-muted")}>
            {fact.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
