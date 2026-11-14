import { Button, HStack, Host, Menu, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  controlSize,
  labelStyle,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { type UnitSystem, formatQuantity } from "@lardon/recipes";

import { useThemeColors } from "#/shared/lib";

export function IngredientControls({
  isScalable,
  scaleFactor,
  onScalePress,
  unitSystem,
  onUnitSystemChange,
}: {
  isScalable: boolean;
  scaleFactor: number;
  onScalePress: () => void;
  unitSystem: UnitSystem;
  onUnitSystemChange: (unitSystem: UnitSystem) => void;
}) {
  const { accent } = useThemeColors("accent");

  return (
    <Host ignoreSafeArea="all" matchContents>
      <HStack spacing={8}>
        {isScalable && (
          <Button
            label={scaleFactor === 1 ? "Scale" : `×${formatQuantity(scaleFactor)}`}
            onPress={onScalePress}
            modifiers={[buttonStyle("glass"), controlSize("small"), tint(accent)]}
          />
        )}
        <Menu
          label="Units"
          systemImage="slider.horizontal.3"
          modifiers={[
            buttonStyle("glassProminent"),
            controlSize("small"),
            tint(accent),
            labelStyle("iconOnly"),
          ]}
        >
          <Picker
            selection={unitSystem}
            onSelectionChange={onUnitSystemChange}
            modifiers={[pickerStyle("inline")]}
          >
            <SwiftText modifiers={[tag("original")]}>As written</SwiftText>
            <SwiftText modifiers={[tag("metric")]}>Metric</SwiftText>
            <SwiftText modifiers={[tag("imperial")]}>Imperial</SwiftText>
          </Picker>
        </Menu>
      </HStack>
    </Host>
  );
}
