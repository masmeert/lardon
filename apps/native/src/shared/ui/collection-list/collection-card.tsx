import { Text, View } from "react-native";

import { SelectionCheck } from "../selection-check";

import type { CollectionItem } from "./collection-item";

export function CollectionCard({ item, coverWidth }: { item: CollectionItem; coverWidth: number }) {
  return (
    <View className="items-center gap-3 px-4 pt-5 pb-4">
      <View
        style={{ width: coverWidth, height: coverWidth }}
        className="items-center justify-center"
      >
        {item.cover(coverWidth)}
        {item.isSelected !== undefined && (
          <View
            style={{ top: Math.round(coverWidth * 0.08), right: Math.round(coverWidth * 0.08) }}
            className="absolute"
          >
            <SelectionCheck isSelected={item.isSelected} isOnPhoto />
          </View>
        )}
      </View>
      <View className="items-center gap-1.5 self-stretch">
        <Text numberOfLines={2} className="text-center text-title font-semibold text-foreground">
          {item.title}
        </Text>
        {item.details}
      </View>
    </View>
  );
}
