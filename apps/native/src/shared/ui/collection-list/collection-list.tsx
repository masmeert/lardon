import type { ReactElement } from "react";
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";

import { cn } from "#/shared/lib";

import { CollectionCard } from "./collection-card";
import type { CollectionItem } from "./collection-item";
import { CollectionRow } from "./collection-row";
import { useListLayout } from "./use-list-layout";

export function CollectionList({
  items,
  emptyState,
}: {
  items: readonly CollectionItem[];
  emptyState?: ReactElement;
}) {
  const [layout] = useListLayout();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 44) / 2;

  return (
    <FlatList
      key={layout}
      data={items}
      keyExtractor={(item) => item.key}
      numColumns={layout === "grid" ? 2 : 1}
      columnWrapperStyle={layout === "grid" ? { gap: 12 } : undefined}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      className="flex-1"
      contentContainerClassName={cn("grow px-4 pt-2 pb-16", layout === "grid" && "gap-3")}
      ItemSeparatorComponent={
        layout === "list"
          ? () => (
              <View className="bg-paper pl-21.5">
                <View style={{ height: StyleSheet.hairlineWidth }} className="bg-hairline" />
              </View>
            )
          : undefined
      }
      renderItem={({ item, index }) => (
        <Pressable
          accessibilityRole={item.onPress ? "button" : undefined}
          disabled={!item.onPress}
          onPress={item.onPress}
          style={{ borderCurve: "continuous", width: layout === "grid" ? cardWidth : undefined }}
          className={cn(
            "bg-paper active:opacity-80",
            layout === "grid" && "rounded-card",
            layout === "list" && index === 0 && "rounded-t-card pt-1",
            layout === "list" && index === items.length - 1 && "rounded-b-card pb-1",
          )}
        >
          {layout === "grid" ? (
            <CollectionCard item={item} coverWidth={cardWidth - 32} />
          ) : (
            <CollectionRow item={item} />
          )}
        </Pressable>
      )}
      ListEmptyComponent={emptyState}
    />
  );
}
