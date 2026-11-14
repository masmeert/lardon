import { useRef } from "react";
import { Pressable, Text, TextInput } from "react-native";

import { useThemeColors } from "#/shared/lib";
import { GroupedRow, GroupedSection } from "#/shared/ui";

import type { RecipeFields } from "../../model/recipe-fields";

type Fact = "servings" | "prepMinutes" | "cookMinutes";

const facts: readonly { key: Fact; label: string; isMinutes: boolean }[] = [
  { key: "servings", label: "Servings", isMinutes: false },
  { key: "prepMinutes", label: "Prep time", isMinutes: true },
  { key: "cookMinutes", label: "Cook time", isMinutes: true },
];

export function DraftFacts({
  fields,
  onChange,
}: {
  fields: RecipeFields;
  onChange: (changes: Partial<RecipeFields>) => void;
}) {
  const { accent, muted } = useThemeColors("accent", "muted");
  const inputs = useRef(new Map<Fact, TextInput>());

  return (
    <GroupedSection>
      {facts.map(({ key, label, isMinutes }, index) => (
        <Pressable key={key} accessible={false} onPress={() => inputs.current.get(key)?.focus()}>
          <GroupedRow label={label} size="lg" isFirst={index === 0}>
            <TextInput
              ref={(input) => {
                if (input) inputs.current.set(key, input);
              }}
              value={fields[key]}
              onChangeText={(text) =>
                onChange({ [key]: text.replace(/\D/g, "").replace(/^0+/, "") })
              }
              placeholder="Optional"
              placeholderTextColor={muted}
              selectionColor={accent}
              accessibilityLabel={isMinutes ? `${label}, in minutes` : label}
              keyboardType="number-pad"
              maxLength={4}
              className="min-w-20 p-0 text-right text-field text-accent"
            />
            {isMinutes && fields[key] && <Text className="-ml-2 text-title text-accent">min</Text>}
          </GroupedRow>
        </Pressable>
      ))}
    </GroupedSection>
  );
}
