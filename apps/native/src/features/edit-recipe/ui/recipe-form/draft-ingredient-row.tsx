import { amountInput, parseIngredientLine } from "@lardon/recipes";
import { useRef } from "react";
import { TextInput, View } from "react-native";

import { useThemeColors } from "#/shared/lib";

import { type IngredientFields, amountText, newIngredient } from "../../model/recipe-fields";

import { DragHandle } from "./drag-handle";
import type { LineControls } from "./draft-list";
import { RemoveLineButton } from "./remove-line-button";
import { UnitMenu } from "./unit-menu";

function withParsedName(ingredient: IngredientFields, text: string): IngredientFields {
  const line = parseIngredientLine(text);

  if (!line || ingredient.amount || ingredient.unit) return { ...ingredient, name: text };

  return {
    ...ingredient,
    amount: line.quantity ? amountText(line.quantity) : "",
    unit: line.unit,
    name: line.name,
  };
}

export function DraftIngredientRow({
  ingredient,
  inputRef,
  onChange,
  onRemove,
  onSplit,
}: { ingredient: IngredientFields } & LineControls<IngredientFields>) {
  const { accent, muted } = useThemeColors("accent", "muted");
  const nameInput = useRef<TextInput>(null);

  return (
    <View className="flex-row items-center gap-3 pr-2">
      <RemoveLineButton
        label={`Remove ${ingredient.name || "this ingredient"}`}
        onPress={onRemove}
      />
      <View className="flex-row items-center gap-1">
        <TextInput
          value={ingredient.amount}
          onChangeText={(amount) => onChange({ ...ingredient, amount: amountInput(amount) })}
          accessibilityLabel="Amount"
          placeholder="Qty"
          placeholderTextColor={muted}
          selectionColor={accent}
          keyboardType="numbers-and-punctuation"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => nameInput.current?.focus()}
          maxLength={4}
          className="h-13 p-0 text-field text-accent"
        />
        <UnitMenu
          unit={ingredient.unit}
          onChange={(unit) => {
            onChange({ ...ingredient, unit });
            nameInput.current?.focus();
          }}
        />
      </View>
      <TextInput
        ref={(input) => {
          nameInput.current = input;

          return inputRef(input);
        }}
        value={ingredient.name}
        onChangeText={(text) => {
          const [first = "", ...rest] = text.split(/\r?\n/);

          if (rest.length === 0) {
            onChange({ ...ingredient, name: text });

            return;
          }

          onSplit([
            withParsedName(ingredient, first),
            ...rest.flatMap((line) =>
              line.trim() ? [withParsedName(newIngredient(), line.trim())] : [],
            ),
          ]);
        }}
        onEndEditing={() => {
          const parsed = withParsedName(ingredient, ingredient.name);

          if (parsed.name !== ingredient.name) onChange(parsed);
        }}
        onSubmitEditing={() =>
          onSplit([withParsedName(ingredient, ingredient.name), newIngredient()])
        }
        submitBehavior="submit"
        returnKeyType="next"
        multiline
        maxLength={200}
        accessibilityLabel="Ingredient"
        placeholder="Ingredient"
        placeholderTextColor={muted}
        selectionColor={accent}
        autoCapitalize="none"
        className="min-h-13 flex-1 py-3.75 text-title text-foreground"
      />
      <DragHandle label={`Move ${ingredient.name || "ingredient"}`} />
    </View>
  );
}
