import { Host, Picker, Text } from "@expo/ui/swift-ui";
import { pickerStyle, tag, tint } from "@expo/ui/swift-ui/modifiers";

import { useThemeColors } from "#/shared/lib";
import { useUnitSystem } from "#/shared/preferences";

export function UnitsPicker() {
  const { accent } = useThemeColors("accent");
  const [unitSystem, setUnitSystem] = useUnitSystem();

  return (
    <Host matchContents>
      <Picker
        label="Units"
        selection={unitSystem}
        onSelectionChange={setUnitSystem}
        modifiers={[pickerStyle("menu"), tint(accent)]}
      >
        <Text modifiers={[tag("original")]}>As written</Text>
        <Text modifiers={[tag("metric")]}>Metric</Text>
        <Text modifiers={[tag("imperial")]}>Imperial</Text>
      </Picker>
    </Host>
  );
}
