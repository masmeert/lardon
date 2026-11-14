import { Button, Host, Menu } from "@expo/ui/swift-ui";
import * as SwiftUI from "@expo/ui/swift-ui/modifiers";

import { useThemeColors } from "#/shared/lib";

import type { useSaveRecipe } from "../model/use-save-recipe";

export function SaveButton({ saving }: { saving: ReturnType<typeof useSaveRecipe> }) {
  const { accent, foreground } = useThemeColors("accent", "foreground");
  const { save, destinations } = saving;
  const isSaved = saving.savedCopy !== undefined;

  const modifiers = [
    SwiftUI.buttonStyle("glass"),
    SwiftUI.buttonBorderShape("circle"),
    SwiftUI.controlSize("large"),
    SwiftUI.labelStyle("iconOnly"),
    SwiftUI.font({ size: 17, weight: "semibold" }),
    SwiftUI.tint(accent),
    SwiftUI.foregroundStyle(isSaved ? accent : foreground),
    SwiftUI.contentTransition("symbolEffect"),
    SwiftUI.disabled(save.isPending || destinations.length === 0),
  ];

  return (
    <Host matchContents>
      {isSaved ? (
        <Button
          label="Saved. Remove from my recipes"
          systemImage="bookmark.fill"
          onPress={saving.unsave}
          modifiers={modifiers}
        />
      ) : destinations.length > 1 ? (
        <Menu label="Save to my recipes" systemImage="bookmark" modifiers={modifiers}>
          {destinations.map((destination) => (
            <Button
              key={destination.familyId}
              label={destination.label}
              systemImage={destination.icon}
              onPress={() => save.mutate(destination.familyId)}
            />
          ))}
        </Menu>
      ) : (
        <Button
          label="Save to my recipes"
          systemImage="bookmark"
          onPress={() => destinations[0] && save.mutate(destinations[0].familyId)}
          modifiers={modifiers}
        />
      )}
    </Host>
  );
}
