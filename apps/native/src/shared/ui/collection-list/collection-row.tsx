import { Text, View } from "react-native";

import { SelectionCheck } from "../selection-check";

import type { CollectionItem } from "./collection-item";

export function CollectionRow({ item }: { item: CollectionItem }) {
  return (
    <View className="flex-row items-center gap-4 px-4 py-2">
      <View className="size-15 items-center justify-center">{item.cover(60)}</View>
      <View className="flex-1 gap-1">
        <Text numberOfLines={1} className="text-body font-medium text-foreground">
          {item.title}
        </Text>
        {item.details}
      </View>
      {item.isSelected !== undefined && <SelectionCheck isSelected={item.isSelected} />}
    </View>
  );
}
