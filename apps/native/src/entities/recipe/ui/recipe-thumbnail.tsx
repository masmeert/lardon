import { View } from "react-native";

import { useThemeColors } from "#/shared/lib";
import { LardonMark } from "#/shared/ui";

export function RecipeThumbnail({ width }: { width: number }) {
  const { white } = useThemeColors("white");

  return (
    <View
      style={{
        width,
        height: width,
        borderRadius: Math.round(width * 0.23),
        borderCurve: "continuous",
      }}
      className="items-center justify-center bg-placeholder"
    >
      <LardonMark width={Math.round(width * 0.5)} color={white} />
    </View>
  );
}
