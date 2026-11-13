import type { ReactElement } from "react";
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";

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

  if (items.length === 0 && emptyState) return emptyState;

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
      contentContainerClassName={
        layout === "grid" ? "grow gap-3 px-4 pt-2 pb-16" : "grow px-4 pb-16"
      }
      ItemSeparatorComponent={
        layout === "list"
          ? () => (
              <View style={{ height: StyleSheet.hairlineWidth }} className="ml-28 bg-muted/30" />
            )
          : undefined
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole={item.onPress ? "button" : undefined}
          accessibilityState={
            item.isSelected === undefined ? undefined : { selected: item.isSelected }
          }
          disabled={!item.onPress && !item.onLongPress}
          onPress={item.onPress}
          onLongPress={item.onLongPress}
          className="active:opacity-80"
        >
          {layout === "grid" ? (
            <CollectionCard item={item} width={(width - 44) / 2} />
          ) : (
            <CollectionRow item={item} />
          )}
        </Pressable>
      )}
    />
  );
}
