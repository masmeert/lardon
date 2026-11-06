import { Surface, Text } from "@lardon/ui";
import { View } from "react-native";

import { Container } from "@/components/container";

export default function TabTwo() {
  return (
    <Container className="p-6">
      <View className="flex-1 items-center justify-center">
        <Surface className="items-center rounded-card p-8">
          <Text variant="display">Tab Two</Text>
        </Surface>
      </View>
    </Container>
  );
}
