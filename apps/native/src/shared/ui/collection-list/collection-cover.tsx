import { View } from "react-native";

import { useThemeColors } from "#/shared/lib";

import { Icon } from "../icon";
import { LardonMark } from "../lardon-mark";

import type { CollectionItem } from "./collection-item";

export function CollectionCover({ item, sizePt }: { item: CollectionItem; sizePt: number }) {
  const { white } = useThemeColors("white");

  if (item.photo) return item.photo;

  return (
    <View className="size-full items-center justify-center bg-placeholder">
      {item.placeholderIcon ? (
        <Icon name={item.placeholderIcon} size={Math.round(sizePt * 0.3)} color={white} />
      ) : (
        <LardonMark width={Math.round(sizePt * 0.45)} color={white} />
      )}
    </View>
  );
}
