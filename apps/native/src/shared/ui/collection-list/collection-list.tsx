import { FlashList } from "@shopify/flash-list";
import type { ReactElement } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";

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

  if (items.length === 0 && emptyState) return emptyState;

  return (
    <FlashList
      key={layout}
      data={items}
      keyExtractor={(item) => item.key}
      numColumns={layout === "grid" ? 2 : 1}
      maintainVisibleContentPosition={{ disabled: true }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 64 }}
      ItemSeparatorComponent={
        layout === "list"
          ? () => (
              <View style={{ height: StyleSheet.hairlineWidth }} className="ml-28 bg-muted/30" />
            )
          : undefined
      }
      renderItem={({ item, index }) => (
        <View
          className={cn(
            layout === "grid" && "pb-3",
            layout === "grid" && (index % 2 === 0 ? "items-start" : "items-end"),
          )}
        >
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
        </View>
      )}
    />
  );
}
