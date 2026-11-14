import { Text, View } from "react-native";

import { iconSize, useThemeColors } from "#/shared/lib";
import { Icon } from "#/shared/ui";

export function RecipeAudience({
  family,
}: {
  family: { id: string; name: string; personal: boolean };
}) {
  const { muted } = useThemeColors("muted");

  return (
    <View className="flex-row items-center justify-center gap-2 pt-4">
      <Icon name={family.personal ? "lock" : "person.2"} size={iconSize.sm} color={muted} />
      <Text className="text-caption text-muted">
        {family.personal ? "Only you can see this recipe" : `Shared with ${family.name}`}
      </Text>
    </View>
  );
}
