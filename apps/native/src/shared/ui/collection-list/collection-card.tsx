import { Text, View } from "react-native";

import { cn } from "#/shared/lib";

import { PhotoFrame } from "../photo-frame";
import { SelectionCheck } from "../selection-check";

import { CollectionCover } from "./collection-cover";
import { CollectionFacts } from "./collection-facts";
import type { CollectionItem } from "./collection-item";

export function CollectionCard({ item, width }: { item: CollectionItem; width: number }) {
  return (
    <PhotoFrame style={{ width, height: Math.round(width * 1.2) }} className="rounded-card p-[3px]">
      <View style={{ borderCurve: "continuous" }} className="flex-1 overflow-hidden rounded-[15px]">
        <CollectionCover item={item} sizePt={width} />
        {item.photo && (
          <View className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-[#00000073] to-[#00000000]" />
        )}
        <Text
          numberOfLines={3}
          className={cn(
            "absolute top-3 left-3 text-title font-semibold",
            item.photo ? "text-white" : "text-accent-deep",
            item.isSelected === undefined ? "right-3" : "right-11",
          )}
        >
          {item.title}
        </Text>
        {item.facts && (
          <View className="absolute bottom-3 left-3">
            <CollectionFacts facts={item.facts} isOnCover />
          </View>
        )}
        {item.isSelected !== undefined && (
          <View className="absolute top-3 right-3">
            <SelectionCheck isSelected={item.isSelected} isOnPhoto />
          </View>
        )}
      </View>
    </PhotoFrame>
  );
}
