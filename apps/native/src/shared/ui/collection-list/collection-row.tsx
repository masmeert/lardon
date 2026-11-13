import { Text, View } from "react-native";

import { PhotoFrame } from "../photo-frame";
import { SelectionCheck } from "../selection-check";

import { CollectionCover } from "./collection-cover";
import { CollectionFacts } from "./collection-facts";
import type { CollectionItem } from "./collection-item";

export function CollectionRow({ item }: { item: CollectionItem }) {
  return (
    <View className="flex-row items-center gap-4 py-2.5">
      <PhotoFrame className="size-24 rounded-card">
        <View style={{ borderCurve: "continuous" }} className="flex-1 overflow-hidden rounded-2xl">
          <CollectionCover item={item} sizePt={96} />
        </View>
      </PhotoFrame>
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
