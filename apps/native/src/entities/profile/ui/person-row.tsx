import type { Person } from "@lardon/api";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PersonAvatar } from "./person-avatar";

export function PersonRow({
  person,
  detail,
  isFirst,
  onPress,
  children,
}: {
  person: Person;
  detail?: string;
  isFirst: boolean;
  onPress: () => void;
  children?: ReactNode;
}) {
  return (
    <View className="pl-4">
      {!isFirst && (
        <View style={{ height: StyleSheet.hairlineWidth }} className="ml-13 bg-hairline" />
      )}
      <View className="min-h-16 flex-row items-center gap-3 py-2.5 pr-4">
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          className="flex-1 flex-row items-center gap-3 active:opacity-70"
        >
          <PersonAvatar person={person} sizePt={40} />
          <View className="flex-1 gap-0.5">
            <Text numberOfLines={1} className="text-title font-semibold text-foreground">
              {person.name || `@${person.username}`}
            </Text>
            <Text numberOfLines={1} className="text-caption text-muted">
              {detail ?? `@${person.username}`}
            </Text>
          </View>
        </Pressable>
        {children}
      </View>
    </View>
  );
}
