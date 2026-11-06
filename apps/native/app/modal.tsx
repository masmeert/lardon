import { Button, Icon, Surface, Text } from "@lardon/ui";
import { router } from "expo-router";
import { View } from "react-native";

import { Container } from "@/components/container";

export default function Modal() {
  return (
    <Container>
      <View className="flex-1 items-center justify-center p-5">
        <Surface className="w-full max-w-sm items-center gap-3 rounded-card p-5">
          <View className="size-12 items-center justify-center rounded-tile bg-accent">
            <Icon name="checkmark" tone="on-accent" size={24} />
          </View>
          <Text variant="headline">Modal screen</Text>
          <Text variant="caption" tone="muted" className="text-center">
            This is an example modal screen for dialogs and confirmations.
          </Text>
          <Button
            label="Close"
            size="compact"
            className="self-stretch"
            onPress={() => router.back()}
          />
        </Surface>
      </View>
    </Container>
  );
}
