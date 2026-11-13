import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { iconSize, useThemeColors } from "#/shared/lib";
import { Button, Icon } from "#/shared/ui";

export function CollectionSection({
  title,
  subtitle,
  onShowAll,
  children,
}: {
  title: string;
  subtitle: string;
  onShowAll?: () => void;
  children?: ReactNode;
}) {
  const { foreground } = useThemeColors("foreground");

  return (
    <View className="gap-4 border-t border-hairline pt-7 pb-8">
      <View className="flex-row items-center justify-between gap-3 px-5">
        <View className="gap-0.5">
          <Text accessibilityRole="header" className="font-heading text-heading text-foreground">
            {title}
          </Text>
          <Text className="text-caption text-muted">{subtitle}</Text>
        </View>
        {onShowAll && (
          <Button
            variant="secondary"
            size="md"
            isIconOnly
            accessibilityLabel={`All ${title.toLocaleLowerCase()}`}
            onPress={onShowAll}
          >
            <Icon name="chevron.right" size={iconSize.md} color={foreground} />
          </Button>
        )}
      </View>
      {children}
    </View>
  );
}
