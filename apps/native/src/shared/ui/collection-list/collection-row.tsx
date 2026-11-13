import { Text, View } from "react-native";

import { SelectionCheck } from "../selection-check";

import { CollectionFacts } from "./collection-facts";
import type { CollectionItem } from "./collection-item";

export function CollectionRow({ item }: { item: CollectionItem }) {
  return (
    <View className="flex-row items-center gap-4 py-2.5">
      <View style={{ borderCurve: "continuous" }} className="size-24 overflow-hidden rounded-card">
        {item.cover(96)}
      </View>
      <View className="flex-1 gap-2">
        <Text numberOfLines={2} className="text-title font-semibold text-foreground">
          {item.title}
        </Text>
        {item.facts && <CollectionFacts facts={item.facts} />}
      </View>
      {item.isSelected !== undefined && <SelectionCheck isSelected={item.isSelected} />}
    </View>
  );
}
