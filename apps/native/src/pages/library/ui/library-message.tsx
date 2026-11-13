import type { ReactNode } from "react";
import { Text, View } from "react-native";

export function LibraryMessage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-10 pb-24">
      <Text className="text-center text-headline font-semibold text-foreground">{title}</Text>
      <Text className="text-center text-body text-muted">{description}</Text>
      {children && <View className="mt-4">{children}</View>}
    </View>
  );
}
