import type { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";

import { Text } from "../typography/text";

export function StoryPage({
  title,
  summary,
  children,
}: PropsWithChildren<{ title: string; summary: string }>) {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-6 pb-16 gap-8">
      <View className="gap-2">
        <Text variant="display">{title}</Text>
        <Text tone="muted">{summary}</Text>
      </View>
      {children}
    </ScrollView>
  );
}
