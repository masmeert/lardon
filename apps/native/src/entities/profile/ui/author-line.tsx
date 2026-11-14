import type { Person } from "@lardon/api";
import { Pressable, Text, View } from "react-native";

import { PersonAvatar } from "./person-avatar";

export function AuthorLine({
  author,
  detail,
  onPress,
}: {
  author: Person;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${author.name || author.username}, ${detail}`}
      onPress={onPress}
      className="flex-row items-center gap-2.5 self-start active:opacity-70"
    >
      <PersonAvatar person={author} sizePt={36} />
      <View>
        <Text numberOfLines={1} className="text-body font-semibold text-foreground">
          {author.name || `@${author.username}`}
        </Text>
        <Text numberOfLines={1} className="text-label text-muted">
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}
