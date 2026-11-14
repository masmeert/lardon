import { type ReactNode, type RefCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, type TextInput, View } from "react-native";
import type { KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import type { AnimatedRef } from "react-native-reanimated";
import Sortable from "react-native-sortables";

import { iconSize, useThemeColors } from "#/shared/lib";
import { GroupedSection, Icon } from "#/shared/ui";

export type LineControls<Line extends { id: string }> = {
  number: number;
  inputRef: RefCallback<TextInput>;
  onChange: (line: Line) => void;
  onSubmit: () => void;
  onRemove: () => void;
  onSplit: (lines: readonly Line[]) => void;
};

export function DraftList<Line extends { id: string }>({
  title,
  lineName,
  lines,
  onChange,
  newLine,
  scrollRef,
  renderLine,
}: {
  title: string;
  lineName: string;
  lines: readonly Line[];
  onChange: (update: (lines: readonly Line[]) => readonly Line[]) => void;
  newLine: () => Line;
  scrollRef: AnimatedRef<KeyboardAwareScrollViewRef>;
  renderLine: (line: Line, controls: LineControls<Line>) => ReactNode;
}) {
  const { accent } = useThemeColors("accent");
  const inputs = useRef(new Map<string, TextInput>());
  const focusNextId = useRef<string | null>(null);

  function inputRef(id: string): RefCallback<TextInput> {
    return (input) => {
      if (!input) return;
      inputs.current.set(id, input);

      if (focusNextId.current === id) {
        focusNextId.current = null;
        input.focus();
      }

      return () => {
        inputs.current.delete(id);
      };
    };
  }

  function replace(id: string, replacements: readonly Line[]) {
    focusNextId.current = replacements.at(-1)?.id ?? null;
    onChange((current) => current.flatMap((line) => (line.id === id ? replacements : [line])));
  }

  function insertAfter(id: string | undefined, line: Line) {
    focusNextId.current = line.id;
    onChange((current) => {
      const index = current.findIndex((candidate) => candidate.id === id);

      return index === -1
        ? [...current, line]
        : [...current.slice(0, index + 1), line, ...current.slice(index + 1)];
    });
  }

  return (
    <GroupedSection title={title}>
      <Sortable.Grid
        data={[...lines]}
        keyExtractor={(line) => line.id}
        customHandle
        scrollableRef={scrollRef}
        rowGap={0}
        onDragEnd={({ data }) => onChange(() => data)}
        renderItem={({ item, index }) => (
          <View className="bg-paper pl-4">
            {index > 0 && (
              <View style={{ height: StyleSheet.hairlineWidth }} className="bg-hairline" />
            )}
            {renderLine(item, {
              number: index + 1,
              inputRef: inputRef(item.id),
              onChange: (changed) =>
                onChange((current) =>
                  current.map((line) => (line.id === changed.id ? changed : line)),
                ),
              onSubmit: () => insertAfter(item.id, newLine()),
              onRemove: () => onChange((current) => current.filter((line) => line.id !== item.id)),
              onSplit: (replacements) => replace(item.id, replacements),
            })}
          </View>
        )}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => insertAfter(undefined, newLine())}
        className="pl-4 active:opacity-60"
      >
        {lines.length > 0 && (
          <View style={{ height: StyleSheet.hairlineWidth }} className="bg-hairline" />
        )}
        <View className="min-h-11 flex-row items-center gap-3 py-2.5 pr-4">
          <Icon name="plus.circle.fill" size={iconSize.lg} color={accent} />
          <Text className="text-title text-foreground">{`Add ${lineName}`}</Text>
        </View>
      </Pressable>
    </GroupedSection>
  );
}
