import { ContentUnavailableView, Host } from "@expo/ui/swift-ui";

import type { IconName } from "./icon";

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <Host style={{ flex: 1 }}>
      <ContentUnavailableView systemImage={icon} title={title} description={description} />
    </Host>
  );
}
