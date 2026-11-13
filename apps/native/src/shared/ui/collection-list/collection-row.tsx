import { Text, View } from "react-native";

import type { CollectionItem } from "./collection-item";

export function CollectionRow({ item }: { item: CollectionItem }) {
  return (
    <View className="flex-row items-center gap-3.5 px-4 py-2.5">
      <View className="size-14 items-center justify-center">{item.cover(56)}</View>
      <View className="flex-1 gap-1">
        <Text numberOfLines={1} className="font-heading text-heading-sm text-foreground">
          {item.title}
        </Text>
        {item.details}
      </View>
    </View>
  );
}
