import { Host, Image } from "@expo/ui/swift-ui";
import { frame } from "@expo/ui/swift-ui/modifiers";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

import { iconSize } from "#/shared/lib";

export type IconName = NonNullable<ComponentProps<typeof Image>["systemName"]>;

export function Icon({
  name,
  size = iconSize.md,
  color,
}: {
  name: IconName;
  size?: number;
  color: ColorValue;
}) {
  return (
    <Host ignoreSafeArea="all" matchContents={{ horizontal: true }} style={{ height: size }}>
      <Image systemName={name} size={size} color={color} modifiers={[frame({ height: size })]} />
    </Host>
  );
}
