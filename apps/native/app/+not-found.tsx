import { Button, Icon, Surface, Text } from "@lardon/ui";
import { router, Stack } from "expo-router";
import { View } from "react-native";

import { Container } from "@/components/container";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <Container>
        <View className="flex-1 items-center justify-center p-5">
          <Surface className="max-w-sm items-center gap-3 rounded-card p-6">
            <Icon name="questionmark.folder" tone="muted" size={32} />
            <Text variant="headline">Page not found</Text>
            <Text variant="caption" tone="muted" className="text-center">
              This page doesn't exist. It may have been moved or deleted.
            </Text>
            <Button label="Go home" size="compact" onPress={() => router.replace("/")} />
          </Surface>
        </View>
      </Container>
    </>
  );
}
