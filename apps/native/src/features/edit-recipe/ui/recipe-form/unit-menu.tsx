import { Host, Menu, Picker, RNHostView, Section, Text as SwiftText } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import type { UnitCode } from "@lardon/recipes";
import { Text, View } from "react-native";

import { cn } from "#/shared/lib";

const unitGroups: readonly { title: string; units: readonly (readonly [UnitCode, string])[] }[] = [
  {
    title: "Weight",
    units: [
      ["g", "Grams"],
      ["kg", "Kilograms"],
      ["oz", "Ounces"],
      ["lb", "Pounds"],
    ],
  },
  {
    title: "Volume",
    units: [
      ["ml", "Millilitres"],
      ["cl", "Centilitres"],
      ["dl", "Decilitres"],
      ["l", "Litres"],
      ["tsp", "Teaspoons"],
      ["tbsp", "Tablespoons"],
      ["cup", "Cups"],
      ["fl oz", "Fluid ounces"],
      ["pint", "Pints"],
      ["quart", "Quarts"],
    ],
  },
  {
    title: "Other",
    units: [
      ["pinch", "Pinch"],
      ["clove", "Clove"],
      ["can", "Can"],
      ["slice", "Slice"],
      ["sprig", "Sprig"],
      ["bunch", "Bunch"],
      ["handful", "Handful"],
    ],
  },
];

export function UnitMenu({
  unit,
  onChange,
}: {
  unit: UnitCode | null;
  onChange: (unit: UnitCode | null) => void;
}) {
  return (
    <Host ignoreSafeArea="all" matchContents>
      <Menu
        label={
          <RNHostView matchContents>
            <View
              pointerEvents="none"
              accessibilityLabel={`Unit, ${unit ?? "none"}`}
              className="h-13 flex-row items-center"
            >
              <Text className={cn("text-title", unit ? "text-accent" : "text-muted")}>
                {unit ?? "unit"}
              </Text>
            </View>
          </RNHostView>
        }
      >
        <Picker
          selection={unit === null ? "none" : undefined}
          onSelectionChange={() => onChange(null)}
          modifiers={[pickerStyle("inline")]}
        >
          <SwiftText modifiers={[tag("none")]}>No unit</SwiftText>
        </Picker>
        {unitGroups.map((group) => (
          <Section key={group.title} title={group.title}>
            <Picker
              selection={group.units.find(([code]) => code === unit)?.[0]}
              onSelectionChange={(selection: UnitCode) => onChange(selection)}
              modifiers={[pickerStyle("inline")]}
            >
              {group.units.map(([code, label]) => (
                <SwiftText key={code} modifiers={[tag(code)]}>
                  {label}
                </SwiftText>
              ))}
            </Picker>
          </Section>
        ))}
      </Menu>
    </Host>
  );
}
