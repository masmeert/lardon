import { Button, ContentUnavailableView, Host } from "@expo/ui/swift-ui";
import { buttonStyle, controlSize, tint } from "@expo/ui/swift-ui/modifiers";

import { useThemeColors } from "#/shared/lib";

import type { IconName } from "./icon";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: { label: string; icon: IconName; onPress: () => void };
}) {
  const { accent } = useThemeColors("accent");

  return (
    <Host style={{ flex: 1 }}>
      <ContentUnavailableView
        systemImage={icon}
        title={title}
        description={description}
        actions={
          action && (
            <Button
              label={action.label}
              systemImage={action.icon}
              onPress={action.onPress}
              modifiers={[buttonStyle("glassProminent"), controlSize("large"), tint(accent)]}
            />
          )
        }
      />
    </Host>
  );
}
